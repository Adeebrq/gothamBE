import { Router, type Request, type Response } from "express";

const route = Router();

/**
 * @route GET /invite
 * @description Test endpoint to verify the rooms route is working
 * @access Public
 */
route.get("/invite", (_req: Request, res: Response): void => {
    res.status(200).json({ 
        success: true, 
        message: "Rooms route is working" 
    });
});

export default route;