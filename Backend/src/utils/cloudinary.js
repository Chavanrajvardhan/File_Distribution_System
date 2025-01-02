import dotenv from "dotenv"
dotenv.config({
    path: './.env'
})

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



const uploadOnCloudinary = async (localFilePath, folderPath) => {
   try {
     if (!(localFilePath && folderPath)) return null
 
     //upload the file on cloudinary
     const  response = await cloudinary.uploader.upload(
         localFilePath, {
         resource_type: "auto",   // here we able to metion file type 
         folder: folderPath, 
     })
     console.log("file is uploaded successfully,  response.url")
     return response
   } catch (error) {
        console.error('File upload failed:', error);
        fs.unlinkSync(localFilePath) // remove the locally saved temporory file as the upload operation got faild

        return null
   }
}


export {uploadOnCloudinary}