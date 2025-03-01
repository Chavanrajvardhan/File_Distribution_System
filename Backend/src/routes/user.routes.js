import { Router } from "express";

import {
    registerUser,
    loginUser,
    logoutUser
} from "../controllers/user.controller.js"

import { verifyJWT } from "../middlwares/auth.middleware.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/validate").get(verifyJWT, (req, res) => {
    return res.status(200).json({
        success: true,
        data: req.user
    });
});

//secured route 

router.route("/logout").post(verifyJWT, logoutUser)

export default router;