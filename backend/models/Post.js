const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  postTitle: { type: String, required: true },
  postDescription: { type: String, required: true }
}, { timestamps: true, collection: 'posts' });

module.exports = mongoose.model('Post', postSchema);











