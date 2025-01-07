import asyncHandler from "../utils/asyncHandler.js";
import connectDB from "../db/db.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {convertToIndianTime} from "../utils/dateTimeConverter.js"


const uploadFile = asyncHandler(async (req, res) => {

    const db = await connectDB()
    const userId = req.user.user_id;
    // const LocalfilePath =  req.files?.file?.[0]?.path;  // if user directly send a file 
    const folder = "OUT";
    const { localFilePath } = req.body;

    if (!localFilePath) {
        return res.status(400).json({
            success: false,
            message: "File path is required. Ensure a file is uploaded.",
        });
    }


    const file = await uploadOnCloudinary(localFilePath, folder)

    if (!file) {
        return res.status(400).json({
            success: false,
            message: "Error while file uploading in  cloudinary "
        })
    }


    try {
        const [insertResult] = await db.query(
            `
            INSERT INTO files (user_id, file_url, file_name, file_size, resource_type, format, folder) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                userId,
                file.url,
                file.original_filename,
                file.bytes, // modify size of file later 
                file.resource_type,
                file.format,
                file.cloudinaryFolder || folder,
            ]
        );

        const [savedFile] = await db.query(
            `
            SELECT * FROM files 
            WHERE file_url = ?
            `,
            [file.url]
        );

        return res.status(200).json({
            success: true,
            data: savedFile[0],
            message: "File uploaded and data stored successfully.",
        });

    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({
            success: false,
            message: "Error storing file information in the database.",
        });
    }
})


const getAllUserFiles = asyncHandler(async (req, res) => {
    const db = await connectDB();
    const userId = req.params.userId;
    console.log(userId)

    console.log(userId)
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
            WHERE user_id = ?
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

    // Retrieve only users with the role "receiver"
    const [result] = await db.query(`
                SELECT 
                    user_id, 
                    first_name, 
                    middle_name, 
                    last_name, 
                    email, 
                    role, 
                    created_at 
                FROM ${dbName}.users
                WHERE role = 'reciver'   
            `);// change speling mistake here and user controller

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


const shareFile = asyncHandler(async (req, res) => {
    const db = await connectDB()

    const { receiverids, file_url, file_name, file_size, resource_type } = req.body;
    const sender_id = req.user.user_id;
    const format = null; // To be handled later
    const created_at = new Date().toISOString(); 
    const updated_at = new Date().toISOString(); 

    const folder = "IN";

    if (!(receiverids && file_url && file_name && file_size && resource_type)) {
        return res.status(400).json({
            status: false,
            message: "All fields are required"
        });
    }

    if (!Array.isArray(receiverids) || receiverids.length === 0) {
        return res.status(400).json({
            status: false,
            message: "Receiver IDs must be an array and cannot be empty"
        });
    }



    const insertPromises = receiverids.map(receiverid => {
        return db.query(
            `INSERT INTO sharefiles (sender_id,user_id, file_url, file_name, file_size, resource_type, format, folder, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sender_id, receiverid, file_url, file_name, file_size, resource_type, format, folder, created_at, updated_at]
        );
    });

    try {
        // Execute all insertions in parallel
        const results = await Promise.all(insertPromises);

        // Check if all insertions were successful
        if (results.some(result => result.length === 0)) {
            return res.status(400).json({
                status: false,
                message: "Error while inserting data into database for one or more users"
            });
        }
        console.log(results)
        return res.status(200).json({
            success: true,
            message: `${receiverids.length} file(s) successfully shared`
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
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
                user_id,
                file_url,
                file_size,
                resource_type,
                file_name, 
                from_time, 
                to_time, 
            CASE 
                WHEN (from_time IS NULL AND to_time IS NULL) THEN 'Available'
                WHEN (NOW() < from_time) THEN 'Unavailable'
                WHEN (NOW() > to_time) THEN 'Unavailable'
                ELSE 'Available'
            END AS status
            FROM 
            sharefiles
            WHERE 
            user_id = ? AND folder = ?;
            `,
            [userId, folder])
            
        if (!result.length) {
            return res.status(404).json({
                success: false,
                message: "No files found for the user.",
            });
        }

        // Convert UTC times to IST for each file
        const filesWithConvertedTimes = result.map(file => {
            return {
                ...file,
                from_time: file.from_time ? convertToIndianTime(file.from_time) : null,
                to_time: file.to_time ? convertToIndianTime(file.to_time) : null,
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


export {
    uploadFile,
    getAllUserFiles,
    getAllReceivers,
    shareFile,
    getAllUserFilesToDownload
}

