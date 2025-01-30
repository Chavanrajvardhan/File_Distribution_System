import { Router } from 'express';

import {
    shareFiles,
    newUserRule,
    shareFilesUsingRules,
    getAllUserRules,
    deleteUserRule,
    updateUserRule

} from "../controllers/rule.controller.js"

import { verifyJWT } from "../middlwares/auth.middleware.js";

const router = Router()
router.use(verifyJWT); // applay verify jwt for all routes

router.route("/shareFiles").post(shareFiles)
router.route("/AddNewRule").post(newUserRule)
router.route("/shareFilesUsingRules").post(shareFilesUsingRules)
router.route("/allUserRules").get(getAllUserRules)
router.route("/deleteRule/:id").delete(deleteUserRule)
router.route("/updateRule/:id").put(updateUserRule)

export default router;