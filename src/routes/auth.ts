import { Router} from "express";
import { register, signin } from "../controller/authController";

const route= Router()

route.post("/register", register)
route.post("/signin", signin)

export default route;