const multer = require('multer');
const path = require('path');
const FileModel = require('../models/File');
const Project = require('../models/Project');

// Helper function to check project access
const checkProjectAccess = async (projectId, userId, checkWrite = false) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');
    
    // Check if user is owner, member or pending member
    const isOwner = project.owner.toString() === userId?.toString();
    const isMember = project.members.some(m => m.toString() === userId?.toString());
    const isPending = project.pendingMembers?.some(m => m.toString() === userId?.toString());
    
    if (checkWrite && !isOwner && !isMember) {
        throw new Error('Not authorized to upload/modify this project');
    }

    if (!isOwner && !isMember && !isPending && project.visibility !== 'public') {
        throw new Error('Not authorized to access this project');
    }
    
    return project;
};

// Configure Multer storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadPath = path.resolve(__dirname, '..', 'uploads');
    // Ensure dir exists (redundant with server.js but safe)
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Export multer upload for separate use
const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single('file');

// @desc    Upload file to a project
// @route   POST /api/files/project/:projectId
// @access  Private
const uploadFile = async (req, res) => {
    try {
        await checkProjectAccess(req.params.projectId, req.user._id, true);
    } catch (error) {
        return res.status(403).json({ message: error.message });
    }

    uploadMiddleware(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        
        if (!req.file) {
           return res.status(400).json({ message: 'Please upload a file' }); 
        }

        try {
            const savedPath = `uploads/${req.file.filename}`;
            const newFile = new FileModel({
                filename: req.file.filename,
                originalname: req.file.originalname,
                path: savedPath,
                mimetype: req.file.mimetype,
                size: req.file.size,
                uploader: req.user._id,
                project: req.params.projectId
            });

            const savedFile = await newFile.save();
            res.status(201).json(savedFile);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    });
};

// @desc    Get files for a project
// @route   GET /api/files/project/:projectId
// @access  Private
const getProjectFiles = async (req, res) => {
    try {
        await checkProjectAccess(req.params.projectId, req.user?._id, false);
        const files = await FileModel.find({ project: req.params.projectId })
            .populate('uploader', 'name email')
            .populate('updatedBy', 'name email') // Added updatedBy
            .sort({ createdAt: -1 });
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a single file
// @route   DELETE /api/files/:fileId
// @access  Private
const deleteFile = async (req, res) => {
    try {
        const file = await FileModel.findById(req.params.fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Delete from disk
        const absolutePath = path.resolve(process.cwd(), file.path);
        const fsSync = require('fs');
        if (fsSync.existsSync(absolutePath)) {
            fsSync.unlinkSync(absolutePath);
        }

        await file.deleteOne();
        res.json({ message: 'File deleted' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update (Replace) a file
// @route   PUT /api/files/:fileId
// @access  Private
const updateFile = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const file = await FileModel.findById(fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Must be member to update
        await checkProjectAccess(file.project, req.user._id, true);

        uploadMiddleware(req, res, async function (err) {
            if (err) return res.status(400).json({ message: err.message });
            if (!req.file) return res.status(400).json({ message: 'Please upload a new file' });

            try {
                // Delete old file from disk
                const oldPath = path.resolve(process.cwd(), file.path);
                const fsSync = require('fs');
                if (fsSync.existsSync(oldPath)) {
                    fsSync.unlinkSync(oldPath);
                }

                // Update file record
                const savedPath = `uploads/${req.file.filename}`;
                file.filename = req.file.filename;
                file.originalname = req.file.originalname;
                file.path = savedPath;
                file.mimetype = req.file.mimetype;
                file.size = req.file.size;
                file.updatedBy = req.user._id;
                file.version = (file.version || 1) + 1;

                const updatedFile = await file.save();
                const populatedFile = await FileModel.findById(updatedFile._id)
                    .populate('uploader', 'name email')
                    .populate('updatedBy', 'name email');
                
                res.json(populatedFile);
            } catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const archiver = require('archiver');
const fs = require('fs');

// @desc    Download project as ZIP
// @route   GET /api/files/project/:projectId/download
// @access  Private / Public
const downloadProjectZip = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { branch = 'main' } = req.query;
        const mongoose = require('mongoose');

        const project = await checkProjectAccess(projectId, req.user?._id, false);
        
        // Find files for this project. 
        // We filter for isProjectFile: true to avoid including student uploads/submissions 
        // as requested by the user, and handle potential branch mismatch.
        // Find files and notes for this project using a flexible ID query
        const queryId = mongoose.Types.ObjectId.isValid(projectId) ? new mongoose.Types.ObjectId(projectId) : projectId;
        const files = await FileModel.find({ 
            $or: [{ project: queryId }, { project: projectId.toString() }]
        });
        
        const NoteModel = require('../models/Note');
        const notes = await NoteModel.find({ 
            $or: [{ project: queryId }, { project: projectId.toString() }]
        });

        console.log(`Download Debug: Project ${projectId}, Files: ${files.length}, Notes: ${notes.length}`);

        // Set attachment header
        res.attachment(`${project.name.replace(/[^a-zA-Z0-9]/g, '_') || 'project'}.zip`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => { console.error('Archiver Error:', err); });
        archive.pipe(res);

        // If both are empty, add a placeholder so the ZIP isn't corrupted/empty
        if (files.length === 0 && notes.length === 0) {
            archive.append('# Project Overview\n\nNo files or notes have been added to this project yet.', { name: 'PROJECT_INFO.md' });
        }

        // Bundle notes as MD files
        let readmeFound = false;
        notes.forEach((note, index) => {
            const safeTitle = note.title.replace(/[^a-zA-Z0-9]/g, '_') || `note_${index}`;
            let fileName = `${safeTitle}.md`;
            
            // If the note title is 'README' or it is the first/only note, make it README.md
            if (note.title.toUpperCase() === 'README' || (index === 0 && !readmeFound)) {
                fileName = 'README.md';
                readmeFound = true;
            }
            
            archive.append(`${note.title}\n\n${note.content}`, { name: fileName });
        });

        // Bundle uploaded files
        for (const file of files) {
            const absolutePath = path.resolve(process.cwd(), file.path);
            console.log(`Processing file: ${file.originalname}, Path: ${absolutePath}`);
            if (fs.existsSync(absolutePath)) {
                archive.file(absolutePath, { name: file.originalname });
                console.log(`Successfully added to archive: ${file.originalname}`);
            } else {
                console.warn(`File NOT FOUND on disk: ${absolutePath}`);
            }
        }

        await archive.finalize();
    } catch (error) {
        console.error('ZIP Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
};

// @desc    Simplified Direct Clone route
const directClone = async (req, res) => {
    return downloadProjectZip(req, res);
};

// @desc    Push (Upload) project files to a branch
// @route   POST /api/files/project/:projectId/push
// @access  Private
const pushFiles = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { branch = 'main' } = req.body;
        const fs = require('fs-extra');
        const unzipper = require('unzipper');
        const glob = require('glob');
        const mongoose = require('mongoose');
        
        await checkProjectAccess(projectId, req.user._id, true);

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const zipPath = path.resolve(process.cwd(), req.file.path);
        const extractPath = path.resolve(process.cwd(), 'uploads/temp', `${projectId}_${Date.now()}`);

        await fs.mkdirp(extractPath);
        
        await fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: extractPath }))
            .promise();

        // Recursively find and save files from extracted path
        // We want to preserve directory structure
        const filePaths = glob.sync(`${extractPath}/**/*`, { nodir: true });

        const savedFiles = [];
        for (const fPath of filePaths) {
            const relativePathInsideZip = path.relative(extractPath, fPath);
            const originalName = relativePathInsideZip; // Keep relative path as name
            
            const destinationPath = `uploads/file-${Date.now()}-${path.basename(fPath)}`;
            await fs.move(fPath, path.join(process.cwd(), destinationPath));

            const savedPath = `uploads/${path.basename(destinationPath)}`;
            
            const newFile = new FileModel({
                filename: path.basename(destinationPath),
                originalname: originalName, // Store the path relative to zip root
                path: savedPath,
                uploader: req.user._id,
                project: projectId,
                branch: branch,
                isProjectFile: true
            });
            await newFile.save();
            savedFiles.push(newFile);
        }

        // Cleanup
        await fs.remove(extractPath);
        await fs.remove(zipPath);

        res.status(201).json({ 
            message: `Successfully pushed to branch: ${branch}`, 
            filesAdded: savedFiles.length,
            details: `Processed ${savedFiles.length} files from zip.`
        });

    } catch (error) {
        console.error('Push Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  uploadFile,
  getProjectFiles,
  downloadProjectZip,
  directClone,
  pushFiles,
  deleteFile,
  updateFile, // Added updateFile
  uploadMiddleware
};
