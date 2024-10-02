import dotenv from "dotenv";
import fs from "fs";
import { PGlite } from "@electric-sql/pglite";
dotenv.config();

const dbPath = `./db`;

if (!fs.existsSync(dbPath)) {
  const postgres = new PGlite(dbPath);
  const dbInitCommands = fs
    .readFileSync(`./db.sql`, "utf-8")
    .toString()
    .split(/(?=CREATE TABLE |INSERT INTO)/);
  for (let cmd of dbInitCommands) {
    console.dir({ "backend:db:init:command": cmd });
    try {
      await postgres.exec(cmd);
    } catch (e) {
      console.dir({ "backend:db:init:error": e });
    }
  }
}
