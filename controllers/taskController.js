const Task = require('../models/taskModel');

// Get tasks
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.userId });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};

// Add task
exports.addTask = async (req, res) => {
    try {
        console.log('Request Body:', req.body); // Log incoming request body
        console.log('User:', req.user); // Log user data if the token is valid

        const { text } = req.body;

        // Ensure task text is provided
        if (!text) {
            return res.status(400).json({ message: 'Task text is required' });
        }

        const task = new Task({ text, userId: req.user.userId }); // Assuming token is valid
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        console.error('Error in addTask:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).send('Task not found');
        }

        if (task.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).send('You are not authorized to delete this task');
        }

        await Task.deleteOne({ _id: id });
        res.status(200).send('Task deleted');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};
