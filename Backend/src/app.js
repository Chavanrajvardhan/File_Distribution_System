import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN, // Allow all origins if CORS_ORIGIN is '*'
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow cookies to be sent with requests
  })
);


app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

app.options('*', cors());
//routes import
import userRouter from './routes/user.routes.js'
import fileRoute from './routes/file.routes.js'
app.use("/api/users", userRouter)
app.use("/api/file", fileRoute)

export { app }