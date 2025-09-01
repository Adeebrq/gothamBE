import { type Response, type Request } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

export const register = async (req: Request, res: Response): Promise<Response> => {
    const { username, password } = req.body;
    const id = uuidv4();

    try {
        const password_hash = await bcrypt.hash(password, 10);
        const usernameSearch = await pool.query(
            `SELECT * FROM users WHERE username = $1`, 
            [username]
        );
        
        if (usernameSearch.rows.length > 0) {
            return res.status(400).json({ message: "Username already exists" });
        }

        await pool.query(
            `INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)`,
            [id, username, password_hash]
        );
        
        return res.status(201).json({ res: true });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(400).json({ res: false, message: errorMessage });
    }
}

export const signin = async (req: Request, res: Response): Promise<Response> => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            `SELECT * FROM users WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = result.rows[0];
        const password_hash = user.password_hash;
        const passwordMatch = await bcrypt.compare(password, password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ res: false, message: "Password is incorrect" });
        }
        
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const jwtToken = jwt.sign(
            { userId: user.id, username: user.username, master_admin: user.master_admin },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            res: true,
            message: "Credentials matched successfully",
            jwtToken
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ res: false, message: errorMessage });
    }
};

