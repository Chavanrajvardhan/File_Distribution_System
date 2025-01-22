import { Router } from 'express';

import {
    shareFilesWithTimeBound,
    newUserRule,
    shareFilesUsingRules,
    getAllUserRules
} from "../controllers/rule.controller.js"

import { verifyJWT } from "../middlwares/auth.middleware.js";

const router = Router()
router.use(verifyJWT); // applay verify jwt for all routes

router.route("/withTimeBound").post(shareFilesWithTimeBound)
// router.route("/scheduleFiles").post(scheduleFilesToShare)
router.route("/AddNewRule").post(newUserRule)
router.route("/shareFilesUsingRules").post(shareFilesUsingRules)
router.route("/allUserRules").get(getAllUserRules)

export default router;