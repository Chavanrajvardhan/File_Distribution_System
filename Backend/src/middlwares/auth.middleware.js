import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import connectDB from "../db/db.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const db = await connectDB()
        const token = req.cookies?.accessToken ;
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
       
        // Query the user by ID in the MySQL database
        const [rows] = await db.query(
            "SELECT user_id, first_name, last_name, email, role, pc_id, center_id, created_at, updated_at from users WHERE user_id = ?",
            [decodedToken._id] // Adjust based on your JWT payload structure
        );

       
        const user = rows[0];

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "invalid access token"
            })
        }

        req.user = user;
        next();
        
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error?.message || "Invalid access token"
        });
    }
});
