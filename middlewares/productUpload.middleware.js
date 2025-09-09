// middlewares/upload.js
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Export the multer instance for single file upload
export const uploadSingle = upload.single("image");

// Optional: If you need a separate controller for just image upload
export const uploadProductImage = (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      return res
        .status(400)
        .json({ msg: "File upload error", error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Return the image URL
    const imageUrl = `/uploads/products/${req.file.filename}`;
    res.json({ imageUrl });
  });
};
