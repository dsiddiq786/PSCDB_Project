// Runs once, when the MongoDB data volume is first created: adds the API's own user,
// limited to reading and writing the pscdb database (the root account is kept for backups only).
const user = process.env.MONGO_APP_USER;
const password = process.env.MONGO_APP_PASSWORD;
if (user && password) {
  db.getSiblingDB("pscdb").createUser({ user, pwd: password, roles: [{ role: "readWrite", db: "pscdb" }] });
}
