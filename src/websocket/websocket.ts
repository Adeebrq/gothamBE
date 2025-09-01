import {WebSocketServer, WebSocket} from "ws"
import {v4 as uuidv4} from "uuid"
import jwt from "jsonwebtoken"
import pool from "../config/db"
import { IncomingMessage } from "http"


interface Client extends WebSocket {
    userId?: string
    username?: string
    roomId?: string
    messageId?: string
    roomName?: string
}

interface MessagePayload {
    type: string
    payload: any
}



const WebSocketSetup = (wss: WebSocketServer) => {
    const clients: Set<Client> = new Set()

    const isValidId= (str: string)=>{
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)

    }

    wss.on("connection", async (ws: Client, req: IncomingMessage) => {
        
        console.log("ws connected")
        const host = req.headers.host || "localhost"
        const url = new URL(req.url || "", `http://${host}`)
        const token = url.searchParams.get("token")
        console.log("token", token)

        if (!token) {
            ws.close(4001, "Missing token")
            return
        }

        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string)
            ws.userId = decoded.userId
            ws.username = decoded.username
            clients.add(ws)
            console.log(`User authenticated: ${ws.username}`)
        } catch (error) {
            console.error("JWT verification error:", error)
            ws.close(4001, "Invalid token")
            return
        }

        ws.on('message', async (data: Buffer) => {
            try {
                const messageStr = data.toString()
                const { payload, type }: MessagePayload = JSON.parse(messageStr)

                if (type === "join") {
                    const {roomId, roomName} = payload

                    if(!isValidId(roomId)){
                        ws.send(JSON.stringify({type: "error", message: "Room id is not a valid uuid"}))
                        return;
                    }

                    try {

                        if (!roomId) {
                            ws.send(JSON.stringify({ type: "error", message: "Room ID is required" }))
                            return
                        }


                        ws.roomId = roomId
                        ws.roomName= roomName

                        if(!ws.userId){
                            ws.send(JSON.stringify({type: "error", message: "UserId not passed in properly"}))
                            return
                        }
    
                        const paymentConfirmationResult= await pool.query(`
                            SELECT payment_status FROM payments WHERE user_id= $1 AND payment_status = $2
                            `, [ws.userId, "completed"])    


                        const paymentConfirmation= paymentConfirmationResult.rows.length > 0;    
    
                        // does room exist?
                        const roomCheck= await pool.query(`
                            SELECT * FROM chatrooms WHERE id= $1
                            `, [ws.roomId])

                        // is user a admin?
                        const adminResult= await pool.query(`
                            SELECT master_admin FROM users WHERE id= $1
                            `, [ws.userId])

                        const isMasterAdmin= adminResult.rows[0]?.master_admin || false
    
                        // create new room
                        if (roomCheck.rows.length ===0 ){
                            if(paymentConfirmation){
                                const newRoom= uuidv4()
                                ws.roomId= newRoom
                                await pool.query(`
                                    INSERT INTO chatrooms (id, name, is_paid_room, creator_id, default_room ) VALUES ($1, $2, $3, $4, $5)
                                    `, [ws.roomId, ws.roomName, true, ws.userId || null, true])
                            }else if(isMasterAdmin){
                                const newRoom= uuidv4()
                                ws.roomId= newRoom
                                await pool.query(`
                                    INSERT INTO chatrooms (id, name, is_paid_room, creator_id, default_room ) VALUES ($1, $2, $3, $4, $5)
                                    `, [ws.roomId, ws.roomName, false, ws.userId || null, true])    
                            }else{
                                ws.send(JSON.stringify({
                                    type: "error",
                                    message: "User is not allowed to create rooms"
                                }))
                                return
                            }
                        }

                        if(roomCheck.rows.length > 0 && roomCheck.rows[0].is_paid_room){
                            const memberResult= await pool.query(`
                                SELECT * FROM chatroom_members WHERE user_id= $1 AND chatroom_id= $2
                                `,[ws.userId, ws.roomId])

                            const isMember= memberResult.rows.length >0
                            const isCreator= roomCheck.rows[0]?.creator_id  === ws.userId

                            if(!isCreator && !isMember && !isMasterAdmin){
                                ws.send(JSON.stringify({
                                    type: "error", 
                                    message: "You dont have access to join this room"
                                }))
                                return
                            }

                        }

                        const blockResult= await pool.query(`
                            SELECT is_blocked FROM chatroom_members WHERE user_id= $1 AND chatroom_id= $2
                            `, [ws.userId, ws.roomId ])
                         

                        if(blockResult.rows.length> 0 && blockResult.rows[0].is_blocked === true){
                            ws.send(JSON.stringify({
                                type: "error", 
                                message: "blocked from room"
                            }))
                            return
                        }    
                        // is the person in the room?
                        const result = await pool.query(
                            `SELECT * FROM chatroom_members WHERE user_id = $1 AND chatroom_id = $2`,
                            [ws.userId, ws.roomId]
                        )
    
                        
                        if (result.rows.length === 0 && !roomCheck.rows[0]?.is_paid_room) {
                                await pool.query(`
                                    INSERT INTO chatroom_members(user_id, chatroom_id, is_admin, is_owner, is_blocked) VALUES 
                                ($1, $2, false, false, false)
                                    `, [ws.userId, ws.roomId])
                                console.log("Added in successfully") 
                        }
    
                        // Send confirmation
                        ws.send(JSON.stringify({
                            type: "joined",
                            payload: { roomId: ws.roomId }
                        }))
                        
                        console.log(`User ${ws.username} (${ws.userId}) joined room ${ws.roomId}`)
                        
                    } catch (error) {
                        console.error("Join error:", error); 
                        ws.send(JSON.stringify({
                            type: "error",
                            message: "A error occured while joining",
                        }))
                        
                    }
                }

                if (type === "message") {

                    const { messageId, content } = payload

                    ws.messageId= messageId

                    if (!ws.roomId) {
                        ws.send(JSON.stringify({ 
                            type: "error", 
                            message: "Join a room first" 
                        }))
                        return
                    }

                    if (!content || content.trim() === "") {
                        ws.send(JSON.stringify({ 
                            type: "error", 
                            message: "Message content cannot be empty" 
                        }))
                        return
                    }

                    // const messageId = uuidv4()
                    const timestamp = new Date().toISOString()

                    try {
                        await pool.query(
                            `INSERT INTO messages (id, chatroom_id, sender_id, content, sent_at, deleted, is_file)
                             VALUES ($1, $2, $3, $4, $5, false, false)`,
                            [ws.messageId, ws.roomId, ws.userId, content, timestamp]
                        )

                        const messagePayload = {
                            type: 'message',
                            payload: {
                                id: ws.messageId,
                                chatroom_id: ws.roomId,
                                sender_id: ws.userId,
                                username: ws.username,
                                content,
                                sent_at: timestamp
                            }
                        }

                        // Broadcast to all clients in the same room
                        clients.forEach((client) => {
                            if (client.readyState === WebSocket.OPEN && client.roomId === ws.roomId) {
                                client.send(JSON.stringify(messagePayload))
                            }
                        })
                    } catch (dbError: any) {
                        console.error("Database error:", dbError)
                        ws.send(JSON.stringify({ 
                            type: "error", 
                            message: "Failed to save message", 
                            dbError: dbError.message
                        }))
                    }
                }
            } catch (error) {
                console.error(`Failed to handle message:`, error)
                ws.send(JSON.stringify({ 
                    type: "error", 
                    message: "Invalid message format" 
                }))
            }
        })

        ws.on('close', () => {
            clients.delete(ws)
            console.log(`Connection closed for user: ${ws.username}`)
        })

        ws.on('error', (error: any) => {
            console.error(`WebSocket error for user ${ws.username}:`, error)
            clients.delete(ws)
        })

        // Send welcome message
        ws.send(JSON.stringify({
            type: "connected",
            payload: { message: "Successfully connected to WebSocket" }
        }))
    })
}

export default WebSocketSetup