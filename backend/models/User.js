const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  emailId: { type: String, required: true, unique: true },
  hashedPassword: { type: String, required: true }
}, { timestamps: true, collection: 'Users' });

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;


