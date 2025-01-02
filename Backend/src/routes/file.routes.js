import { Router } from 'express';

import {
    uploadFile,
    getAllUserFiles,
    getAllReceivers,
    shareFile,
    getAllUserFilesToDownload
} from "../controllers/file.controller.js"

import { verifyJWT } from "../middlwares/auth.middleware.js";
import {upload} from "../middlwares/multer.middleware.js"

const router = Router()
router.use(verifyJWT); // applay verify jwt for all routes

router.route("/uploadFile").post(
    // upload.fields([{
    //     name: "file",
    //     maxCount: 1
    // }]),             //if we accept dirct file 
    uploadFile
)

router.route("/allUserFiles/:userId").post(getAllUserFiles)
router.route("/getAllReceivers").get(getAllReceivers)
router.route("/shareFile").post(shareFile);
router.route("/availabeToDownload").post(getAllUserFilesToDownload);

export default router;