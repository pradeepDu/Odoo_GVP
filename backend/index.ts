import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/db";
import routes from "./src/routes";
import { startEmailWorker, stopEmailWorker } from "./src/queues/emailWorker";

dotenv.config({ path: "./.env", quiet: true });

const app = express();
app.use(express.json());
app.use(cors({ 
  origin: true, // Allow any origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.status(200).json({
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

    // Start BullMQ email worker
    startEmailWorker();

    app.listen(PORT, () => {
      console.log(`FleetFlow API running on port ${PORT}`);
      console.log(`🚀 Server ready: HTTP + Email Queue Worker`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[Server] Shutting down gracefully...");
  await stopEmailWorker();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n[Server] Shutting down gracefully...");
  await stopEmailWorker();
  process.exit(0);
});
