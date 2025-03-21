const User = require('../models/User');
const { hobbiesToVector, calculateSimilarity } = require('../utils/vectorUtils');

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
            // Update hobby embeddings if hobbies are updated
            if (hobbies) {
                user.hobbyEmbeddings = hobbiesToVector(hobbies);
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
        const userId = req.user._id;
        const currentUser = await User.findById(userId);

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get all users except current user
        const allUsers = await User.find(
            { _id: { $ne: userId } },
            'username hobbies isOnline'
        );

        // Calculate similarity scores and add online status priority
        const matchesWithScores = allUsers.map(user => {
            const currentUserHobbies = currentUser.hobbies.map(h => h.toLowerCase());
            const matchUserHobbies = user.hobbies.map(h => h.toLowerCase());

            const commonHobbies = currentUserHobbies.filter(hobby =>
                matchUserHobbies.includes(hobby)
            );

            const similarityScore = commonHobbies.length /
                Math.max(currentUserHobbies.length, matchUserHobbies.length);

            return {
                _id: user._id,
                username: user.username,
                hobbies: user.hobbies,
                isOnline: user.isOnline,
                commonHobbies: commonHobbies,
                similarityScore: similarityScore
            };
        });

        // Sort users by online status first, then by similarity score
        const sortedMatches = matchesWithScores.sort((a, b) => {
            // First priority: online status
            if (a.isOnline !== b.isOnline) {
                return a.isOnline ? -1 : 1;
            }
            // Second priority: similarity score
            return b.similarityScore - a.similarityScore;
        });

        return res.json({
            success: true,
            matches: sortedMatches
        });

    } catch (error) {
        console.error('Error finding matches:', error);
        res.status(500).json({
            success: false,
            message: 'Error finding matches',
            error: error.message
        });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, email, password, hobbies } = req.body;

        // Generate vector using existing utility
        const hobbyEmbeddings = hobbiesToVector(hobbies);

        const user = new User({
            username,
            email,
            password,
            hobbies,
            hobbyEmbeddings
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user'
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    findMatches
};