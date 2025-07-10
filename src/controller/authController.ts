import { Router, type Response, type Request, type NextFunction } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.ts";
import { v4 as uuidv4 } from "uuid";

export const register = async(req: Request, res: Response)=>{
    const {username, password} = req.body
    const id= uuidv4()

    const password_hash= await bcrypt.hash(password, 10)

    try {
        const insertQuery= await pool.query(`
            INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)
            `, [id, username, password_hash]) 
            res.status(201).json({"res": true})
    } catch (error: any) {
        res.status(400).json({"res": error || error.message})
    }

}

export const signin = async(req: Request, res: Response)=>{
    const {username, password}= req.body

    const result= await pool.query(`
        SELECT * FROM users WHERE username = $1
        `, [username])
     if(result.rows.length===0){
        return res.status(404).json({"message": "User not found"})
     }   

    const password_hash= result.rows[0].password_hash
    const passwordMatch= await bcrypt.compare(password, password_hash)

    if(passwordMatch){
        res.status(200).json({"res": true, "message": "Credentials matched successfully"})
    }else{
        res.status(404).json({"res": false, "message": "Password is incorrect"})
    }
    
}

