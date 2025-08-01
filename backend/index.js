const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();

// === Middleware ===
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'https://zingy-froyo-3ecbf5.netlify.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔍 Debug middleware to print body
app.use((req, res, next) => {
  console.log("🔥 Incoming Request");
  console.log("➡️ Method:", req.method);
  console.log("📍 Path:", req.path);
  console.log("📝 Body:", req.body);
  next();
});

// === MongoDB connection ===
const mongoURI = process.env.MONGO_URI;
console.log("🔍 ENV MONGO_URI =", process.env.MONGO_URI);

//const mongoURI = "mongodb://localhost:27017/diary";
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.once('open', () => {
  console.log("✅ MongoDB is open and ready");
});

// === Schemas & Models ===
const userSchema = new mongoose.Schema({
  emailId: String,
  hashedPassword: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const postSchema = new mongoose.Schema({
  postTitle: String,
  postDescription: String,
  userID: mongoose.Types.ObjectId
}, {
  timestamps: true,
  collection: 'posts'
});
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// === Routes ===

// Root test
app.get('/', (req, res) => {
  res.status(200).json({ message: "API is running" });
});

app.get('/ping', (req, res) => res.send('pong'));

// Register
app.post('/registerUser', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const existingUser = await User.findOne({ emailId: email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ emailId: email, hashedPassword });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
app.post('/userLogin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const user = await User.findOne({ emailId: email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    res.status(200).json({ message: "Login successful", userID: user._id.toString() });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create Post
app.post('/createPost', async (req, res) => {
  console.log("📥 /createPost hit");
  console.log("📝 req.body:", req.body);

  const { postTitle, postDescription, userID } = req.body;

  if (!postTitle || !postDescription || !userID)
    return res.status(400).json({ message: 'All fields are required' });

  if (!mongoose.Types.ObjectId.isValid(userID))
    return res.status(400).json({ message: 'Invalid userID format' });

  try {
    const user = await User.findById(userID);
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    const newPost = new Post({ postTitle, postDescription, userID });
    await newPost.save();

    return res.status(201).json({
      message: 'Post added successfully',
      postID: newPost._id
    });
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts by user
app.get('/getMyPosts/:userID', async (req, res) => {
  const { userID } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userID))
    return res.status(400).json({ message: 'Invalid userID' });

  try {
    const posts = await Post.find({ userID }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get post by ID
app.post('/getPostByID', async (req, res) => {
  const { postID } = req.body;

  if (!postID || !mongoose.Types.ObjectId.isValid(postID))
    return res.status(400).json({ message: 'Invalid postID' });

  try {
    const post = await Post.findById(postID);
    if (!post)
      return res.status(404).json({ message: 'Post not found' });

    res.status(200).json(post);
  } catch (err) {
    console.error('Get post by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 404 fallback (must be last)
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
});
