import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = "PawnTicket/upload"; 
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
      const fileExtension = path.extname(file.originalname);
      const fileName = Date.now() + fileExtension;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); 
    } else {
      cb(new Error("ประเภทไฟล์ไม่รองรับ"), false); 
    }
  },
});

router.post("/upload", upload.array("files", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "file_not_found", message: "ไม่มีไฟล์ที่อัปโหลด" });
    }

    const filePaths = req.files.map((file) => `/PawnTicket/upload/${file.filename}`);
    res.status(200).json({
      message: "ไฟล์อัปโหลดสำเร็จ",
      filePaths: filePaths,
    });
  } catch (err) {
    console.error("Error in uploading files:", err);
    res.status(500).json({ error: "server_error", message: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" });
  }
});

export default router;
