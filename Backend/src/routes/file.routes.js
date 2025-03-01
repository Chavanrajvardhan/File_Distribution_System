import { Router } from "express";

import {
  uploadFiles,
  getAllUserFiles,
  getAllReceivers,
  getAllUserFilesToDownload,
  deleteFile,
  getAllDeletedFiles,
  RestoreFile,
  permanentDeleteFile,
  getFileStatus,
  downloadFiles,

  // getFileStatus,
} from "../controllers/file.controller.js";

import { verifyJWT } from "../middlwares/auth.middleware.js";
import { upload } from "../middlwares/multer.middleware.js";

const router = Router();
router.use(verifyJWT); // applay verify jwt for all routes

router.route("/uploadFile").post(
  upload.array("file", 25), // Accept up to 25 files for the "file" field
  uploadFiles
);

router.route("/allUserFiles/:userId").post(getAllUserFiles);
router.route("/getAllReceivers").get(getAllReceivers);
router.route("/availableToDownload").post(getAllUserFilesToDownload);
router.route("/deleteFile/:fileIds").post(deleteFile);
router.route("/RestoreFile/:fileId").post(RestoreFile);
router.route("/permanentDelete/:fileId").delete(permanentDeleteFile);
router.route("/allDeletedFiles/:userId").get(getAllDeletedFiles);
router.route("/fileStatus").get(getFileStatus);
router.route("/downloadFiles").post(downloadFiles)

export default router;
