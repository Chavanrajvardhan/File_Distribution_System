import { Router } from 'express';

import {
    shareWithTimeBoundRule
} from "../controllers/rule.controller.js"

import { verifyJWT } from "../middlwares/auth.middleware.js";

const router = Router()
router.use(verifyJWT); // applay verify jwt for all routes

router.route("/withTimeBound").post(shareWithTimeBoundRule)

export default router;