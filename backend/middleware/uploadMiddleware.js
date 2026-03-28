const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

function checkFileType(file, cb) {
    if (file.fieldname === 'thumbnail') {
        const filetypes = /jpg|jpeg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images only! (jpg, jpeg, png, webp)'));
        }
    } else if (file.fieldname === 'video') {
        const filetypes = /mp4|mkv|avi|webm|mov/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        // Simple mime check for videos
        if (extname && file.mimetype.startsWith('video/')) {
            return cb(null, true);
        } else {
            cb(new Error('Videos only! (mp4, mkv, avi, webm, mov)'));
        }
    } else {
        cb(new Error('Invalid field'));
    }
}

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 500, // 500 MB max size
    },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

module.exports = upload;
