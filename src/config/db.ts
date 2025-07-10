import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()

const pool= new Pool({
    user: process.env.DB_USER ,
    host: process.env.DB_HOST ,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD
})

pool.on("connect", ()=>{
    console.log("Connected to db")
})


export default pool;