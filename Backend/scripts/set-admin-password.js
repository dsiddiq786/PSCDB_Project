/* Sets the password for an admin account, asking for it without showing it on screen.
   Usage (on the server): docker compose --env-file .env.production exec api node scripts/set-admin-password.js admin@pscdb.org */
import "dotenv/config";
import readline from "node:readline";
import argon2 from "argon2";
import mongoose from "mongoose";
import Admin from "../DBModels/Admin.js";

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      // Show the question, but not the characters being typed.
      if (text.includes(question)) process.stdout.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Give the admin email, for example: node scripts/set-admin-password.js admin@pscdb.org");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const admin = await Admin.findOne({ email });
if (!admin) {
  console.error(`No admin account uses ${email}.`);
  process.exit(1);
}

const password = await ask("New password (at least 12 characters): ");
const repeat = await ask("Type it again: ");
if (password !== repeat) {
  console.error("The passwords do not match. Nothing was changed.");
  process.exit(1);
}
if (password.length < 12 || password.length > 200) {
  console.error("Use at least 12 characters. Nothing was changed.");
  process.exit(1);
}

const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
await Admin.updateOne({ _id: admin._id }, { $set: { passwordHash, failedLogins: 0, lockedUntil: null, active: true } });
console.log(`Password updated for ${email}. Sign in at https://pscdb.org/admin`);
await mongoose.disconnect();
