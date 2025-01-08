const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

const SECRET_KEY = process.env.SECRET_KEY || 'yourSecretKey';

// User registration
exports.registerUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username already exists');
        }

        // Hash password and save user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};


// User login
exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Invalid credentials');
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, SECRET_KEY);
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};