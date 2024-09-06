import express from "express";
import cors from "cors";
const app = express();
//common middleware
app.use(
    cors({
        origin:process.env.CORS_ORIGIN,
        Credential:true
    })
)
//common middleware
app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))

import healthcheckRouter from "./routes/healthcheck.routes.js"
import userregister from "./routes/userregister.routes.js"

app.use("/api/v1/user",userregister);
app.use("/api/v1/healthcheck",healthcheckRouter);



export {app}