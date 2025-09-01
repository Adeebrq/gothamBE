import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import route from "./routes/auth";
import TableCreation from "./data/tablecreation";
import { WebSocketServer } from "ws";
import SimpleWebSocketSetup from "./websocket/websocket";
import http from "http";
import roomsRoute from "./routes/rooms";
import { chatHistory } from "./controller/chatController";

dotenv.config();

if (!process.env.PORT) {
    console.error("PORT is not defined in environment variables");
    process.exit(1);
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Initialize database tables
TableCreation();

// Routes
app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});

// API Routes
app.use("/v1/auth", route);
app.use("/v1/rooms/:roomId/history", chatHistory);
app.use("/v1/rooms", roomsRoute);

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Initialize WebSocket
SimpleWebSocketSetup(wss);

const PORT = parseInt(process.env.PORT, 10) || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: any) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: any) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});