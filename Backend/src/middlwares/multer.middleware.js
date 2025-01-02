import multer from "multer";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)   // here we add namming convetion for file name currenty we use orignal name that sended by user
    }
  })
  
export const upload = multer({ 
    storage, 
})