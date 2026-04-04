const mongoose = require('mongoose');
const FileModel = require('./models/File');
const NoteModel = require('./models/Note');
const Project = require('./models/Project');
require('dotenv').config();

const checkProject = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const projectIdString = '69ac31410d97aacdc252a9c0';
        const projectId = new mongoose.Types.ObjectId(projectIdString);
        
        const project = await Project.findById(projectId);
        console.log('Project ID:', projectIdString);
        console.log('Project Name:', project ? project.name : 'NOT FOUND');
        
        const filesCount = await FileModel.countDocuments({ project: projectIdString });
        const filesCountObj = await FileModel.countDocuments({ project });
        
        console.log('Files count (String):', filesCount);
        console.log('Files count (ObjectId):', filesCountObj);
        
        const files = await FileModel.find({ project: projectIdString });
        files.forEach(f => {
             console.log(`- ${f.originalname}, Branch: ${JSON.stringify(f.branch)}, Project: ${JSON.stringify(f.project)}, Path: ${f.path}`);
        });
        
        const notes = await NoteModel.find({ project: projectIdString });
        console.log('Notes count:', notes.length);
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkProject();
