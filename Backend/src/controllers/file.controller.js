import asyncHandler from "../utils/asyncHandler.js";
import connectDB from "../db/db.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"


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
            INSERT INTO files (user_id, file_url, file_name, file_size, resource_type, format, folder, created_at) 
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
                file.created_at,
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

    const {receiverid, file_url, file_name, file_size, resource_type} = req.body;
    const format = null // verify it later work on file formate in later 

    const folder = "IN"
    if(!(receiverid &&  file_url && file_name && file_size &&  resource_type )){
        return res.status(400).json({
            status: false,
            message: "All fileds are required"
        })
    }

    const [result] = await db.query(`
            INSERT INTO files (user_id, file_url, file_name, file_size, resource_type, format, folder) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [   
            receiverid,
            file_url,
            file_name,
            file_size, // modify size of file later 
            resource_type,
            format,
            folder,
        ]
    )

    if(result.length == 0){
        res.status(400).json({
            status:false,
            message:"Error while inserting data in database"
        })
    }

    return res.status(200).json({
        success: true,
        data: result[0],
        message: "Data successfully inserted into database"
    })
})


const getAllUserFilesToDownload = asyncHandler(async (req, res) => {
    const db = await connectDB();
    const userId = req.user.user_id;
    const folder = "IN"

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
            WHERE user_id = ? AND folder = ?
            `,
            [userId, folder]
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
            message: "All user files to download fetched successfully",
        });
    } catch (error) {
        
        return res.status(500).json({
            success: false,
            message: "Error fetching user files.",
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

