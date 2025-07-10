import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import route from "./routes/auth.ts"
import pool from "./config/db.ts"
import TableCreation from "./data/tablecreation.ts"

dotenv.config()

const app= express()
app.use(express.json())
app.use(cors())

TableCreation()

app.get("/", async(req: any, res: any)=>{
    res.status(200).json("All good")
})

//auth
app.use("/v1/auth", route)

app.listen(process.env.PORT, ()=> console.log("Port running on", process.env.PORT))