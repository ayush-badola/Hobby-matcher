const User = require('../models/User');
const { calculateSimilarity } = require('../utils/vectorUtils');

// Get user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { hobbies } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            user.hobbies = hobbies || user.hobbies;
            // Update interests vector if hobbies are updated
            if (hobbies) {
                user.interestsVector = hobbiesToVector(hobbies);
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                hobbies: updatedUser.hobbies
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Find matching users
const findMatches = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const allUsers = await User.find({ _id: { $ne: req.user._id } }).select('-password');

        const matches = allUsers.map(otherUser => ({
            user: {
                _id: otherUser._id,
                username: otherUser.username,
                hobbies: otherUser.hobbies
            },
            similarity: calculateSimilarity(user.interestsVector, otherUser.interestsVector)
        }));

        // Sort by similarity and get top 5 matches
        const topMatches = matches
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);

        res.json(topMatches);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    findMatches
};