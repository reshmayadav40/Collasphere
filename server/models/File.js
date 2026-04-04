const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalname: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
  },
  size: {
      type: Number,
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project',
  },
  branch: {
    type: String,
    default: 'main',
  },
  isProjectFile: {
    type: Boolean,
    default: false,
  },
  version: {
    type: Number,
    default: 1,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

const FileModel = mongoose.model('File', fileSchema);
module.exports = FileModel;
