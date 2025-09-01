import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userId: string;
    username: string;
    master_admin: boolean;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        res.status(401).json({ success: false, message: "No token provided" });
        return;
    }

    if (!process.env.JWT_SECRET) {
        res.status(500).json({ 
            success: false, 
            message: "Server configuration error" 
        });
        return;
    }

    jwt.verify(
        token, 
        process.env.JWT_SECRET,
        (err: jwt.VerifyErrors | null, decoded: unknown) => {
            if (err) {
                res.status(403).json({ 
                    success: false, 
                    message: "Invalid or expired token" 
                });
                return;
            }
            
            // Type guard to ensure decoded is JwtPayload
            if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
                req.user = decoded as JwtPayload;
                next();
            } else {
                res.status(403).json({ 
                    success: false, 
                    message: "Invalid token payload" 
                });
            }
        }
    );
};