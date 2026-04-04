const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['invite', 'update', 'delete'],
    default: 'invite',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
