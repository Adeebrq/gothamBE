import { type Request, type request, type NextFunction } from "express"

const authenticateToken =(req: Request, res: Response, next: NextFunction)=>{
    const authHeader= req.headers.authorization
    const token= authHeader && authHeader.split(" ")[1]

}