import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const dir = "./uploads/sellers";
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

const sellerUpload = upload.fields([
  { name: "govt_id_proof", maxCount: 1 },
  { name: "business_license", maxCount: 1 },
  { name: "profile_photo", maxCount: 1 },
]);

export default sellerUpload;
