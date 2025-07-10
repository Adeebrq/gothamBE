import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import route from "./routes/auth.ts"

dotenv.config()

const app= express()
app.use(express.json())
app.use(cors())

app.get("/", (req: any, res: any)=>{
    res.status(200).json("All good")
})

//auth
app.use("/v1/auth", route)

app.listen(process.env.PORT, ()=> console.log("Port running on", process.env.PORT))