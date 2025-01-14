const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const URI = process.env.MONGO_URI
const SECRET_KEY = process.env.JWT_SECRET
const PORT = process.env.PORT || 5000

// Establish a MongoDB connection on server start
let mongoConnectionStatus = 'Pending...';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));

// Connect to MongoDB
mongoose.connect(URI)
    .then(() => {
        console.log('Connected to MongoDB');
        mongoConnectionStatus = 'Connected to MongoDB successfully'
    })
    .catch((err) => console.error('MongoDB connection error:', err));

// Define task schema
const taskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Define User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Create models
const Task = mongoose.model('Task', taskSchema);
const User = mongoose.model('User', userSchema);

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Access Denied');
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).send('Invalid token');
        req.user = user;
        next();
    });
};

// Basic endpoint to check if server is running
app.get('/', (req, res) => {
    res.json({
        message: 'Server is running',
        mongoConnectionStatus,
    });
});


// Endpoint to register a user
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).send('Username already exists');
    }

    // Hash password and save the new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });

    await newUser.save();
    res.status(201).send('User registered successfully');
});

// Endpoint to login a user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).send('Invalid username or password');
    }

    // Compare password with hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(400).send('Invalid username or password');
    }

    // Create a JWT token
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token, username: user.username });
});

// Endpoint to create a new task
app.post('/tasks', authenticateToken, async (req, res) => {
    const { text } = req.body;
    const userId = req.user.userId;

    // Validate request body
    if (!text) {
        return res.status(400).send('Please provide a task');
    }

    // Create and save new task
    const newTask = new Task({ text, userId });
    await newTask.save();

    res.status(201).send('Task added');
});

// Endpoint to get all tasks for the logged-in user
app.get('/tasks', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const tasks = await Task.find({ userId });
    res.json(tasks);
});

// Endpoint to update a task
app.put('/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { text } = req.body; // Updated task text
    const userId = req.user.userId; // Extract userId from JWT

    // Validate request body
    if (!text || !text.trim()) {
        return res.status(400).send('Task text cannot be empty');
    }

    try {
        // Find the task by ID
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).send('Task not found');
        }

        // Check if the task belongs to the logged-in user
        if (task.userId.toString() !== userId.toString()) {
            return res.status(403).send('You are not authorized to update this task');
        }

        // Update the task
        task.text = text;
        await task.save();

        res.status(200).json({ message: 'Task updated successfully', task });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint to delete a task
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    // Find and delete task
    const task = await Task.findById(id);
    if (!task) {
        return res.status(404).send('Task not found');
    }

    if (task.userId.toString() !== userId.toString()) {
        return res.status(403).send('You are not authorized to delete this task');
    }

    await Task.deleteOne({ _id: id });
    res.status(200).send('Task deleted');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

