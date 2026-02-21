import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/db";
dotenv.config({ path: "./.env", quiet: true });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "FleetFlow API is running", version: "1.0.0" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is up and running" });
});

connectDb().then(() => {
  console.log("NeonDB Connected");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
