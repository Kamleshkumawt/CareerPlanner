import 'dotenv/config.js';
import http from 'http';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cors from 'cors';
import connectDB from './config/db.js';

const app = express();


app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

app.use("/api", limiter);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}


app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.get("/health", (req: Request, res: Response) => {
  console.log("Health check requested", { ip: req.ip });
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    statusCode: 404,
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const server = http.createServer(app);
    await connectDB();
    server.listen(port, () => {
      console.log("Server started successfully", {
        port: port,
        environment: process.env.NODE_ENV || "development",
        healthCheck: `http://localhost:${port}/health`,
        apiBase: `http://localhost:${port}/api`,
      });
    });
  } catch (error) {
    console.log(error);
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();