import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/db";
import routes from "./src/routes";

dotenv.config({ path: "./.env", quiet: true });

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res
    .status(200)
    .json({
      status: "ok",
      message: "FleetFlow API is running",
      version: "1.0.0",
    });
});

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is up and running" });
});

app.use("/api", routes);

connectDb()
  .then(() => {
    console.log("PostgreSQL connected");
    app.listen(PORT, () => {
      console.log(`FleetFlow API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
