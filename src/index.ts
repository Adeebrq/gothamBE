import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import route from "./routes/auth.ts"
import TableCreation from "./data/tablecreation.ts"
import { WebSocketServer } from "ws"
import SimpleWebSocketSetup from "./websocket/websocket.ts"
import http from "http"
import roomsRoute from "./routes/rooms.ts"
import { chatHistory } from "./controller/chatController.ts"

dotenv.config()

const app= express()
app.use(express.json())
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
TableCreation()

app.get("/", async(req: any, res: any)=>{
    res.status(200).json("All good")
})

//auth
app.use("/v1/auth", route)

// chat hsitory
app.use("/v1/rooms/:roomId/history", chatHistory)

//rooms
app.use("/v1/rooms", roomsRoute)

const server= http.createServer(app)

const wss= new WebSocketServer({server})
SimpleWebSocketSetup(wss)
server.listen(process.env.PORT, ()=> console.log("Port running on", process.env.PORT))