const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById, addMember, removeMember, acceptInvite, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createProject)
    .get(protect, getProjects);

router.route('/:id')
    .get(optionalProtect, getProjectById)
    .put(protect, updateProject)
    .delete(protect, deleteProject);

router.route('/:id/accept')
    .post(protect, acceptInvite);

router.route('/:id/members')
    .post(protect, addMember)
    .get(optionalProtect, getProjectById);

router.route('/:id/members/:memberId')
    .delete(protect, removeMember);

module.exports = router;
