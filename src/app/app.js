import express from "express";
import authRoutes from "../routes/auth.routes.js"
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express();

app.use(cors({
    origin: "https://thought-space-theta.vercel.app",
    credentials: true
}))


app.use(express.json())
app.use(cookieParser())

app.get("/" , (req,res) => {
    res.send("Its done bro :)")
})

app.use("/api/auth", authRoutes)

export default app
