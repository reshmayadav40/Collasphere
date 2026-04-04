const express = require('express');
const router = express.Router();
const { uploadFile, getProjectFiles, downloadProjectZip, pushFiles, deleteFile, updateFile, uploadMiddleware } = require('../controllers/fileController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Use a very unique path to avoid any Express routing conflicts
router.get('/download/project/:projectId', optionalProtect, downloadProjectZip);

router.route('/project/:projectId/push')
    .post(protect, uploadMiddleware, pushFiles); 

router.route('/project/:projectId')
    .post(protect, uploadFile)
    .get(optionalProtect, getProjectFiles);

router.route('/:fileId')
    .put(protect, updateFile)
    .delete(protect, deleteFile);

module.exports = router;
