import { Router, type Response, type Request, type NextFunction } from "express";

const route= Router()

route.get("/signup", (req: Request, res: Response)=>{
    res.status(200).json("Sign up api")
})

export default route