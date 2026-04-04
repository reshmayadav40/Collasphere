const express = require('express');
const router = express.Router();
const { createNote, getProjectNotes, getNoteById, updateNote, deleteNote } = require('../controllers/noteController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createNote);

router.route('/project/:projectId')
    .get(optionalProtect, getProjectNotes);

router.route('/:id')
    .get(optionalProtect, getNoteById)
    .put(protect, updateNote)
    .delete(protect, deleteNote);

module.exports = router;
