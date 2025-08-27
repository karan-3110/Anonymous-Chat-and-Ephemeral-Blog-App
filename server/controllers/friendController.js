// controllers/friendController.js
const Friend = require('../models/friendModel');

exports.getFriendsForUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const friend = await Friend.findOne({ anonId: userId });
    if (!friend) return res.json({ friends: [] });
    res.json({ friends: friend.friends });
  } catch (error) {
    console.error('Failed to get friends:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
};

// Get friend list
const getFriendList = async (req, res) => {
  try {
    const { anonId } = req.params;
    const friend = await Friend.findOne({ anonId });
    if (!friend) return res.json({ friends: [] });
    res.json({ friends: friend.friends });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Add a friend
const addFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    if (!userId || !friendId || userId === friendId) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    console.log(`🔁 Adding friend: ${userId} ↔ ${friendId}`);

    await Friend.findOneAndUpdate(
      { anonId: userId },
      { $addToSet: { friends: friendId } },
      { new: true, upsert: true }
    );

    await Friend.findOneAndUpdate(
      { anonId: friendId },
      { $addToSet: { friends: userId } },
      { new: true, upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Could not add friend:', err);  // <-- more detailed error
    res.status(500).json({ error: 'Could not add friend' });
  }
};



// Remove a friend
const removeFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    await Friend.updateOne({ anonId: userId }, { $pull: { friends: friendId } });
    await Friend.updateOne({ anonId: friendId }, { $pull: { friends: userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove friend' });
  }
};

module.exports = {
  getFriendList,
  addFriend,
  removeFriend
};
