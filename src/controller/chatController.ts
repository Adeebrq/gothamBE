import { type Response, type Request } from "express";
import pool from "../config/db.js";

export const chatHistory = async(req: Request, res: Response)=>{
    const {roomId}= req.params
    const {limit, before, after}= req.query

    if(!roomId){
        res.status(404).json({type: "error", message: "room not found"})
        return
    }

    try {
        
        let queryFetch= `SELECT m.content, m.id, m.sent_at, u.username, u.id as sender_id
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chatroom_id= $1 AND m.deleted = false
        ORDER BY m.sent_at DESC
        LIMIT $2
        `
        const params= [roomId, parseInt(limit as string) || 50]

    if(before){
        queryFetch += ` AND m.sent_at < $3`
        params.push(before as string)
    }else if(after){
        queryFetch += ` AND m.sent_at > $3`
        params.push(after as string)
        
    }
    
    const chatHistory= await pool.query(queryFetch, params)

    res.status(200).json({
        type: "success",
        messages: chatHistory.rows.reverse(),

    })

        
    } catch (error) {
        res.status(400).json({type: "error", message: error})
    }

}