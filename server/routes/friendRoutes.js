// server/routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const Friend = require('../models/friendModel');

// Get friend list by anonId
router.get('/:anonId', async (req, res) => {
  try {
    const { anonId } = req.params;
    const friend = await Friend.findOne({ anonId });
    if (!friend) return res.json({ friends: [] });
    res.json({ friends: friend.friends });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a friend
router.post('/add', async (req, res) => {
  const { anonId, friendId } = req.body;

  if (!anonId || !friendId) {
    console.error("🚨 Missing anonId or friendId", req.body);
    return res.status(400).json({ error: "Missing anonId or friendId" });
  }

  try {
    await Friend.findOneAndUpdate(
      { anonId },
      { $addToSet: { friends: friendId } },
      { upsert: true, new: true }
    );

    await Friend.findOneAndUpdate(
      { anonId: friendId },
      { $addToSet: { friends: anonId } },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: 'Friendship added' });

  } catch (err) {
    console.error("🔥 Error adding friendship:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});





// Remove a friend
router.post('/remove', async (req, res) => {
  try {
    const { anonId, friendId } = req.body;
    await Friend.updateOne({ anonId: anonId }, { $pull: { friends: friendId } });
    await Friend.updateOne({ anonId: friendId }, { $pull: { friends: anonId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove friend' });
  }
});

module.exports = router;
