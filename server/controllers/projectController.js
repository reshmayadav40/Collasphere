const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, visibility } = req.body;

    const project = new Project({
      name,
      description,
      visibility: visibility || 'private',
      owner: req.user._id,
      members: [req.user._id] // Owner is also a member
    });

    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user projects (owned and member of)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const userId = req.user._id;
        const projects = await Project.find({
            $or: [
                { owner: userId },
                { members: userId },
                { pendingMembers: userId }
            ]
        }).populate('owner', 'name email').sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private / Public
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
        .populate('owner', 'name email')
        .populate('members', 'name email')
        .populate('pendingMembers', 'name email');

    if (project) {
        // If private, ensure user is part of the project (owner, member, or pending)
        const userId = req.user?._id?.toString();
        const isOwner = project.owner._id.toString() === userId;
        const isMember = project.members.some(m => (m._id || m).toString() === userId);
        const isPending = project.pendingMembers.some(m => (m._id || m).toString() === userId);

        if (project.visibility === 'private' && !isOwner && !isMember && !isPending) {
            return res.status(403).json({ message: 'Not authorized to view this project' });
        }
      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Owner only)
const addMember = async (req, res) => {
    try {
        const { email } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        // Ensure only owner can add members
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project owner can add members' });
        }

        const userToAdd = await User.findOne({ email });
        if (!userToAdd) return res.status(404).json({ message: 'User not found' });

        const memberId = userToAdd._id.toString();
        // Check if already member
        if (project.members.some(m => (m._id || m).toString() === memberId)) {
            return res.status(400).json({ message: 'User is already a member' });
        }
        // Check if already pending
        if (project.pendingMembers?.some(m => (m._id || m).toString() === memberId)) {
            return res.status(400).json({ message: 'Invitation already pending' });
        }

        project.pendingMembers.push(userToAdd._id);
        await project.save();

        // Create an in-app notification for the invited user
        const Notification = require('../models/Notification');
        const existingNotif = await Notification.findOne({
            recipient: userToAdd._id,
            project: project._id,
            type: 'invite'
        });

        if (!existingNotif) {
            await Notification.create({
                recipient: userToAdd._id,
                sender: req.user._id,
                type: 'invite',
                project: project._id,
                message: `${req.user.name} invited you to collaborate on project: ${project.name}`
            });
        }

        res.json({ message: 'Member added successfully', project });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private (Owner or self)
const removeMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const memberId = req.params.memberId;
        const userId = req.user._id.toString();

        // Only owner can remove others
        if (project.owner.toString() !== userId && memberId !== userId) {
            return res.status(403).json({ message: 'Only project owners can remove members' });
        }

        // Project owner cannot be removed
        if (memberId === project.owner.toString()) {
            return res.status(400).json({ message: 'Project owner cannot be removed' });
        }

        // Remove from both members and pendingMembers
        project.members = project.members.filter(m => (m._id || m).toString() !== memberId);
        project.pendingMembers = (project.pendingMembers || []).filter(m => (m._id || m).toString() !== memberId);
        
        await project.save();

        // Optional: Notify the user they were removed
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: memberId,
            sender: req.user._id,
            type: 'delete',
            project: project._id,
            message: `${req.user.name} removed you from project: ${project.name}`
        });

        res.json({ message: 'Member removed successfully', project });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Accept project invite
// @route   POST /api/projects/:id/accept
// @access  Private
const acceptInvite = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const userId = req.user._id.toString();

        // Check if user is in pendingMembers
        if (!project.pendingMembers?.some(m => m.toString() === userId)) {
            return res.status(400).json({ message: 'No invitation found for this user' });
        }

        // Move from pendingMembers to members
        project.pendingMembers.pull(req.user._id);
        if (!project.members.includes(req.user._id)) {
            project.members.push(req.user._id);
        }
        await project.save();

        res.json({ message: 'Invitation accepted!', project });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Owner only)
const updateProject = async (req, res) => {
    try {
        const { name, description, visibility } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        // Ensure only owner can update
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project owner can update project settings' });
        }

        project.name = name || project.name;
        project.description = description || project.description;
        if (visibility) project.visibility = visibility;

        const updatedProject = await project.save();
        res.json(updatedProject);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Ensure only owner can delete
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project owner can delete this repository' });
        }

        const File = require('../models/File');
        const Note = require('../models/Note');
        const fs = require('fs-extra');
        const path = require('path');

        // Delete all associated files from disk
        const files = await File.find({ project: project._id });
        for (const f of files) {
          const absPath = path.resolve(process.cwd(), f.path);
          if (await fs.exists(absPath)) await fs.remove(absPath);
        }

        // Delete DB records
        await File.deleteMany({ project: project._id });
        await Note.deleteMany({ project: project._id });
        await project.deleteOne();

        res.json({ message: 'Project and all associated data deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  addMember,
  removeMember,
  acceptInvite, // Added acceptInvite
  updateProject,
  deleteProject
};
