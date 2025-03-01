import asyncHandler from "../utils/asyncHandler.js";
import connectDB from "../db/db.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { convertToIndianTime } from "../utils/dateTimeConverter.js";
import { uploadFilesOnS3Bucket, downloadFilesOnS3Bucket  } from "../utils/awsService.js";
import mime from 'mime-types'

const uploadFiles = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const userId = req.user.user_id;
  const files = req.files;
  const folder = "File_Distribution_System/OUT"
  console.log(files)
  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one file is required. Ensure files are uploaded.",
    });
  }
 
  try {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const localFilePath = file.path;
        const orignalFileName = file.originalname;
        const size = file.size;
        const format = mime.extension(file.mimetype)
        console.log(localFilePath,orignalFileName,size,format)
        const uploadedFile = await uploadFilesOnS3Bucket(localFilePath, folder);
 
        if (!uploadedFile) {
          throw new Error(
            `Error uploading file: ${file.originalname} to S3 bucket.`
          );
        }
 
        const file_url = uploadedFile.Location;
        console.log(uploadedFile)
        // Save file details in the database
 
        await db.query(
          `
                       INSERT INTO files (user_id, file_url, file_name, file_size, format, folder, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                       `,
          [
            userId,
            file_url,
            orignalFileName,
            size,
            format,
            folder,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );
 
        const [savedFile] = await db.query(
          `
                           SELECT * FROM files
                           WHERE file_url = ?
                           `,
          [uploadedFile.Location]
        );
 
        return {
          data: savedFile[0],
          // data: uploadedFile,
        };
      })
    );
    const fileNames = uploadedFiles.map((file) => file.data.file_name).join(", ");
 
    return res.status(200).json({
      success: true,
      data: uploadedFiles,
      message: `${fileNames}  uploaded successfully.`,
    });
  } catch (error) {
    console.error("Database  error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading files and storing information in the database.",
    });
  }
});

const getAllUserFiles = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  try {
    const [result] = await db.query(
      `
            SELECT * FROM files 
            WHERE user_id = ? AND delete_flag = FALSE
            `,
      [userId]
    );

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "No files found for the user.",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
      count: result.length,
      message: "All user files fetched successfully",
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user files.",
    });
  }
});

const getAllReceivers = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const dbName = process.env.DBNAME;
  const userId = req.user.user_id;

  // Retrieve only users with the role "receiver"
  const [result] = await db.query(
    `
                SELECT
                    user_id,
                    first_name,
                    middle_name,
                    last_name,
                    email,
                    role,
                    created_at
                FROM ${dbName}.users
                WHERE
                  role IN ('receiver', 'senderreceiver')
                  AND user_id != ?  
 
            `,
    [userId]
  );
  if (result.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No receivers found",
    });
  }

  return res.status(200).json({
    success: true,
    data: result,
    count: result.length,
    message: "All receivers fetched successfully",
  });
});

const getAllUserFilesToDownload = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const userId = req.user.user_id;
  const folder = "IN"; // Assuming 'IN' is the folder you're interested in

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  try {
    const [result] = await db.query(
      `
                          SELECT 
                   id, 
                   sender_id,
                   sender_name,
                   user_id,
                   file_url,
                   file_size,
                   file_name, 
                   from_time, 
                   to_time,
                   status,
                   created_at,
                   CASE 
                        WHEN from_time IS NULL AND to_time IS NULL THEN 'Available'
                       WHEN from_time IS NOT NULL AND to_time IS NULL THEN 
                            CASE 
                                WHEN UTC_TIMESTAMP() < from_time THEN 'Unavailable'
                                ELSE 'Available'
                            END
                        WHEN from_time IS NULL AND to_time IS NOT NULL THEN 
                            CASE 
                                WHEN UTC_TIMESTAMP() > to_time THEN 'Unavailable'
                                ELSE 'Available'
                            END
                        WHEN from_time IS NOT NULL AND to_time IS NOT NULL THEN 
                            CASE 
                                WHEN UTC_TIMESTAMP() < from_time THEN 'Unavailable'
                                WHEN UTC_TIMESTAMP() BETWEEN from_time AND to_time THEN 'Available'
                                ELSE 'Unavailable'
                            END
                    END AS availabilityStatus
                FROM 
                   sharefiles
                WHERE 
                   user_id = ? 
                    AND folder = ? 
                    AND status = 'completed';
                    
                            `,
      [userId, folder]
    );

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "No files found for the user.",
      });
    }

    // Convert UTC times to IST for each file
    const filesWithConvertedTimes = result.map((file) => {
      return {
        ...file,
        from_time: file.from_time ? convertToIndianTime(file.from_time) : null,
        to_time: file.to_time ? convertToIndianTime(file.to_time) : null,
        created_at: file.created_at
          ? convertToIndianTime(file.created_at)
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: filesWithConvertedTimes,
      count: filesWithConvertedTimes.length,
      message: "All user files to download fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching user files.",
      error: error.message,
    });
  }
});

const downloadFiles = asyncHandler(async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) {
      return res.status(400).json({ message: "File name required" });
    }
 
    const folder = "File_Distribution_System/OUT";
    const fileData = await downloadFilesOnS3Bucket(folder, fileName);
 
    if (!fileData || !fileData.Body) {
      return res.status(404).json({ message: "File not found in S3" });
    }
 
    // Set headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", fileData.ContentType || "application/octet-stream");
 
    // Send file data as a binary stream
    return res.send(fileData.Body);
  } catch (error) {
    console.error("Error downloading file:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

const deleteFile = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const fileIds = req.params.fileIds;

  if (!fileIds) {
    return res.status(400).json({
      success: false,
      message: "No file IDs provided for deletion",
    });
  }

  try {
    // Split the file IDs into an array
    const fileIdArray = fileIds
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter(Boolean);

    if (fileIdArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid file IDs provided",
      });
    }
    const deleted_at = new Date().toISOString(); // ISO 8601 format

    // Update the files to mark as deleted
    const [result] = await db.query(
      `UPDATE files SET delete_flag = TRUE, deleted_at = ? WHERE file_id IN (?)`,
      [deleted_at, fileIdArray]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No files found to delete",
      });
    }

    return res.status(200).json({
      success: true,
      message: `${result.affectedRows} file(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting files:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting files",
    });
  }
});

const getAllDeletedFiles = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  try {
    const [result] = await db.query(
      `
          SELECT * FROM files
          WHERE delete_flag = TRUE AND user_id = ?
          `,
      [userId]
    );

    const filesWithConvertedTimes = result.map((file) => ({
      ...file,
      deleted_at: file.deleted_at ? convertToIndianTime(file.deleted_at) : null,
    }));

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "No files found for the user.",
      });
    }

    return res.status(200).json({
      success: true,
      data: filesWithConvertedTimes,
      count: result.length,
      message: "All deleted files fetched successfully",
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching deleted files.",
    });
  }
});

const RestoreFile = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const fileId = req.params.fileId;

  if (!fileId) {
    return res.status(400).json({
      success: false,
      message: "Invalid file ID",
    });
  }

  try {
    // Set delete_flag to FALSE and reset deleted_at to NULL (or to current time if preferred)
    const [result] = await db.query(
      `UPDATE files
       SET delete_flag = FALSE, deleted_at = NULL
       WHERE file_id = ?;`,
      [fileId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No file found to restore",
      });
    }

    return res.status(200).json({
      success: true,
      message: "File restored successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error restoring file",
    });
  }
});

const permanentDeleteFile = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const fileId = req.params.fileId;

  if (!fileId) {
    return res.status(400).json({
      success: false,
      message: "Invalid file ID",
    });
  }

  try {
    const [result] = await db.query(`DELETE FROM files WHERE  file_id = ?;`, [
      fileId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No file found to delete",
      });
    }

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting file",
    });
  }
});

const getFileStatus = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const userId = req.user.user_id;
  const role = req.user.role;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  try {
    let totalFilesAvailable = 0;
    let totalFilesDownloaded = 0;
    let totalFilesSent = 0;

    if (role === "sender") {
      const [filesUploaded] = await db.query(
        `
                  SELECT * FROM files 
                  WHERE delete_flag = FALSE AND user_id = ?
                  `,
        [userId]
      );

      const [filesShared] = await db.query(
        `
                  SELECT * FROM sharefiles 
                  WHERE sender_id = ?
                  `,
        [userId]
      );

      totalFilesAvailable = filesUploaded.length;
      totalFilesSent = filesShared.length;
    } else if (role === "receiver") {
      const [filesDownloaded] = await db.query(
        `
                  SELECT * FROM sharefiles 
                  WHERE status = "completed" AND user_id = ?
                  `,
        [userId]
      );

      totalFilesDownloaded = filesDownloaded.length;
    } else if (role === "senderreceiver") {
      const [filesUploaded] = await db.query(
        `
                  SELECT * FROM files 
                  WHERE delete_flag = FALSE AND user_id = ?
                  `,
        [userId]
      );

      const [filesShared] = await db.query(
        `
                  SELECT * FROM sharefiles 
                  WHERE sender_id = ?
                  `,
        [userId]
      );

      const [filesDownloaded] = await db.query(
        `
                  SELECT * FROM sharefiles 
                  WHERE status = "completed" AND  user_id = ?
                  `,
        [userId]
      );

      totalFilesAvailable = filesUploaded.length;
      totalFilesSent = filesShared.length;
      totalFilesDownloaded = filesDownloaded.length;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalFilesAvailable,
        totalFilesDownloaded,
        totalFilesSent,
      },
      message: "File status fetched successfully",
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching file status.",
    });
  }
});

export {
  uploadFiles,
  getAllUserFiles,
  getAllReceivers,
  getAllUserFilesToDownload,
  downloadFiles,
  deleteFile,
  getAllDeletedFiles,
  RestoreFile,
  permanentDeleteFile,
  getFileStatus,
};
