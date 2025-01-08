const express = require('express');
const { getTasks, addTask, deleteTask } = require('../controllers/taskController');
// const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || '123456';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).send('Access Denied');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).send('Invalid Token');
    }
};

router.get('/', authenticateToken, getTasks);
router.post('/', authenticateToken, addTask);
router.delete('/:id', authenticateToken, deleteTask);

module.exports = router;
