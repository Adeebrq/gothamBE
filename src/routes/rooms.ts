import {Router, type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.ts";
import jwt from "jsonwebtoken"

const route = Router()

route.get("/invite", (req: Request, res: Response)=>{
    res.status(200).json({"res":"all good"})
})

export default route;