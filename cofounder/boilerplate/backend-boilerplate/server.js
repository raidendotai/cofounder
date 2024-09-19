import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { PGlite } from "@electric-sql/pglite";
dotenv.config();

const app = express();
const port = process.env.PORT || 1337;
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/", (req, res) => {
  res.json({ message: "cofounder backend boilerplate :)" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
