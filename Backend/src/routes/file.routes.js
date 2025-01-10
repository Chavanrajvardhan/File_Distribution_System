import { Router } from 'express';

import {
    uploadFiles,
    getAllUserFiles,
    getAllReceivers,
    shareFile,
    getAllUserFilesToDownload,
    deleteFile,
    getAllDeletedFiles,
    RestoreFile,

    // getFileStatus,
} from "../controllers/file.controller.js"

import { verifyJWT } from "../middlwares/auth.middleware.js";
import {upload} from "../middlwares/multer.middleware.js"

const router = Router()
router.use(verifyJWT); // applay verify jwt for all routes

router.route("/uploadFile").post(
    upload.array("file", 25), // Accept up to 25 files for the "file" field
    uploadFiles
);

router.route("/allUserFiles/:userId").post(getAllUserFiles)
router.route("/getAllReceivers").get(getAllReceivers)
router.route("/shareFile").post(shareFile);
router.route("/availableToDownload").post(getAllUserFilesToDownload);
router.route("/deleteFile/:fileIds").post(deleteFile);
router.route("/RestoreFile/:fileId").post(RestoreFile);
router.route("/allDeletedFiles/:userId").get(getAllDeletedFiles);

// router.route("/filestats").get(getFileStatus);



export default router;