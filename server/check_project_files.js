const mongoose = require('mongoose');
const FileModel = require('./models/File');
const NoteModel = require('./models/Note');
const Project = require('./models/Project');
require('dotenv').config();

const checkProject = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const projectId = '69ac31410d97aacdc252a9c0';
        
        const project = await Project.findById(projectId);
        console.log('Project:', project ? project.name : 'NOT FOUND');
        
        const files = await FileModel.find({ project: projectId });
        console.log('Files count:', files.length);
        files.forEach(f => console.log(`- ${f.originalname} (branch: ${f.branch}) path: ${f.path}`));
        
        const notes = await NoteModel.find({ project: projectId });
        console.log('Notes count:', notes.length);
        notes.forEach(n => console.log(`- ${n.title}`));
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkProject();
