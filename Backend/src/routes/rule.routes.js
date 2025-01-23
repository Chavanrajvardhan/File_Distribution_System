import { Router } from 'express';

import {
    shareFiles,
    newUserRule,
    shareFilesUsingRules,
    getAllUserRules
} from "../controllers/rule.controller.js"

import { verifyJWT } from "../middlwares/auth.middleware.js";

const router = Router()
router.use(verifyJWT); // applay verify jwt for all routes

router.route("/shareFiles").post(shareFiles)
// router.route("/scheduleFiles").post(scheduleFilesToShare)
router.route("/AddNewRule").post(newUserRule)
router.route("/shareFilesUsingRules").post(shareFilesUsingRules)
router.route("/allUserRules").get(getAllUserRules)

export default router;