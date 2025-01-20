import { Router } from 'express';

import {
    shareWithTimeBoundRule,
<<<<<<< HEAD
    scheduleFilesToShare,
    newUserRule,
    shareFilesUsingRules,
    getAllUserRules
=======
    scheduleFilesToShare
>>>>>>> 2da7fb94a51e7ba7bb3c14119c4d515f8457a95a
} from "../controllers/rule.controller.js"

import { verifyJWT } from "../middlwares/auth.middleware.js";

const router = Router()
router.use(verifyJWT); // applay verify jwt for all routes

router.route("/withTimeBound").post(shareWithTimeBoundRule)
router.route("/scheduleFiles").post(scheduleFilesToShare)
<<<<<<< HEAD
router.route("/AddNewRule").post(newUserRule)
router.route("/shareFilesUsingRules").post(shareFilesUsingRules)
router.route("/allUserRules").get(getAllUserRules)
=======
>>>>>>> 2da7fb94a51e7ba7bb3c14119c4d515f8457a95a

export default router;