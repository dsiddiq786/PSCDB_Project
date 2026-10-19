/* Creates an admin account or sets a new password, asking for the password without showing it.
   Run on the server from /opt/pscdb:
     Reset a password:   docker compose --env-file .env.production exec api node scripts/set-admin-password.js admin@pscdb.org
     Create a superadmin: docker compose --env-file .env.production exec api node scripts/set-admin-password.js new@example.org --create "Full Name" */
import "dotenv/config";
import readline from "node:readline";
import argon2 from "argon2";
import mongoose from "mongoose";
import Admin from "../DBModels/Admin.js";
import { properName } from "../services/names.js";

const [, , rawEmail, flag, fullName] = process.argv;
const email = (rawEmail || "").trim().toLowerCase();
const creating = flag === "--create";

if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email) || (creating && !fullName?.trim())) {
  console.error('Usage: node scripts/set-admin-password.js <email> [--create "Full Name"]');
  process.exit(1);
}

/* One reader for both questions; typed characters are not echoed. */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
let muted = false;
rl._writeToOutput = (text) => {
  if (!muted) process.stdout.write(text);
};
const lines = rl[Symbol.asyncIterator]();
async function ask(question) {
  process.stdout.write(question);
  muted = true;
  const { value = "" } = await lines.next();
  muted = false;
  process.stdout.write("\n");
  return value;
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await Admin.findOne({ email });
  if (creating && existing) throw new Error(`${email} already has an account. Run without --create to set its password.`);
  if (!creating && !existing) throw new Error(`No admin account uses ${email}. Add --create "Full Name" to create one.`);

  const password = await ask("New password (at least 12 characters): ");
  const repeat = await ask("Type it again: ");
  if (password !== repeat) throw new Error("The passwords do not match. Nothing was changed.");
  if (password.length < 12 || password.length > 200) throw new Error("Use at least 12 characters. Nothing was changed.");

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  if (creating) {
    await Admin.create({ email, name: properName(fullName).slice(0, 100), passwordHash, role: "superadmin", active: true });
    console.log(`Created superadmin ${email}. Sign in at https://pscdb.org/admin`);
  } else {
    await Admin.updateOne({ _id: existing._id }, { $set: { passwordHash, failedLogins: 0, lockedUntil: null, active: true }, $inc: { tokenVersion: 1 } });
    console.log(`Password updated for ${email}. Sign in at https://pscdb.org/admin`);
  }
  process.exitCode = 0;
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await mongoose.disconnect();
}
