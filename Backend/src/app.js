import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "../src/utils/logger.js";
import morgan from "morgan";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN, // Allow all origins if CORS_ORIGIN is '*'
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow cookies to be sent with requests
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.options("*", cors());

const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

//routes import
import userRouter from "./routes/user.routes.js";
import fileRoute from "./routes/file.routes.js";
import ruleRoute from "./routes/rule.routes.js";

app.use("/api/users", userRouter);
app.use("/api/file", fileRoute);
app.use("/api/rule", ruleRoute);

export { app };
