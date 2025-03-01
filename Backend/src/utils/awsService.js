import dotenv from "dotenv"
dotenv.config({
  path: './.env'
})
import AWS from 'aws-sdk';
import fs from 'fs'
import path from 'path';
 
const s3 = new AWS.S3({
  accessKeyId: process.env.S3BUCKET_ACCESS_KAY_ID,
  secretAccessKey: process.env.S3BUCKET_SECRET_ACCESS_KAY,
  bucketName: process.env.S3BUCKET_NAME,
});
 
 
 
async function uploadFilesOnS3Bucket(filePath, folderName, fileName) {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath);
    const originalFileName = fileName || path.basename(filePath);
    const params = {
      Bucket: process.env.S3BUCKET_NAME,
      Key: `${folderName}/${originalFileName}`,
      Body: fileContent,
    };
 
    // Upload the file
    const response = await s3.upload(params).promise();
 
    if (response) {
      console.log('File uploaded successfully:', response.Location);
    }
 
    if (filePath) {
      fs.unlinkSync(filePath);
    }
    return response;
 
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
 
async function downloadFilesOnS3Bucket(folderName, fileName) {
  try {
    const originalFileName = fileName || path.basename(filePath);
    const params = {
      Bucket: process.env.S3BUCKET_NAME,
      Key: `${folderName}/${originalFileName}`,
    };

    const response = await s3.getObject(params).promise();
 
    if (response) {
      console.log('File downloaded successfully:', response.Location);
    }
 
    return response;
 
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
 
export {
  uploadFilesOnS3Bucket,
  downloadFilesOnS3Bucket
};