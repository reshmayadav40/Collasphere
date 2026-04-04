const Note = require('../models/Note');
const Project = require('../models/Project');

// Helper function to check project access
const checkProjectAccess = async (projectId, userId, checkWrite = false) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');
    
    const isMember = project.members.includes(userId);
    
    // If it's a write operation, must be member
    if (checkWrite && !isMember) {
        throw new Error('Not authorized to modify this project');
    }

    // If it's a read operation, allow if member OR if project is public
    if (!isMember && project.visibility !== 'public') {
        throw new Error('Not authorized to access this project');
    }
    
    return project;
};

// @desc    Create a note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const { title, content, project: projectId } = req.body;
    
    await checkProjectAccess(projectId, req.user._id, true);

    const note = new Note({
      title,
      content,
      author: req.user._id,
      project: projectId
    });

    const createdNote = await note.save();
    res.status(201).json(createdNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notes for a project
// @route   GET /api/notes/project/:projectId
// @access  Private
const getProjectNotes = async (req, res) => {
  try {
    await checkProjectAccess(req.params.projectId, req.user?._id, false);
    const notes = await Note.find({ project: req.params.projectId }).populate('author', 'name email').sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get note by ID
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('author', 'name email');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    await checkProjectAccess(note.project, req.user?._id, false);
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
    try {
        const { title, content } = req.body;
        const note = await Note.findById(req.params.id);
        
        if (!note) return res.status(404).json({ message: 'Note not found' });
        await checkProjectAccess(note.project, req.user._id, true);

        note.title = title || note.title;
        note.content = content || note.content;

        const updatedNote = await note.save();
        res.json(updatedNote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        
        // Grant permission if the user is the author or the project owner
        const project = await Project.findById(note.project);
        if (note.author.toString() !== req.user._id.toString() && project.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this note' });
        }

        await note.deleteOne();
        res.json({ message: 'Note removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  createNote,
  getProjectNotes,
  getNoteById,
  updateNote,
  deleteNote
};
