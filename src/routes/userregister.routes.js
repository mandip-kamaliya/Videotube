import { Router } from "express";
import {registeruser} from "../controllers/registeruser.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { logout } from "../controllers/registeruser.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverimage",
            maxCount:1
        }
    ]       
    ),registeruser
)
router.route("/logout").post(verifyJWT,logout)

export default router;