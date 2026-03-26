const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary.js');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('image'), (req, res) => {
  try {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) return res.status(500).json(error);
        res.json({ imageUrl: result.secure_url });
      }
    );

    stream.end(req.file.buffer);

  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;