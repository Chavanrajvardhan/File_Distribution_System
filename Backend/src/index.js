import dotenv from "dotenv"

dotenv.config({
    path: './.env'
})

import { scheduleFiles } from "./utils/scheduleFiles.js";
import connectDB from "./db/db.js";
import { app } from "./app.js";

scheduleFiles();


connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`⚙️ Server is running at port ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("Mysql db connection failed !!! ", err);
})