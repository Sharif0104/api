const prisma = require("../utils/prisma");

exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id; // Always use authenticated user
    const { receiverId } = req.body;
    if (senderId === receiverId) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }
    await prisma.friendRequest.create({
      data: { senderId, receiverId, status: "pending" }
    });
    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("Send friend request error:", error);
    res.status(400).json({ message: "Failed to send friend request" });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const receiverId = req.user.id; // Only authenticated user can accept
    const { senderId } = req.body;
    const request = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } }
    });
    if (!request || request.status !== "pending") {
      return res.status(400).json({ message: "No pending friend request found" });
    }
    await prisma.friendRequest.update({
      where: { senderId_receiverId: { senderId, receiverId } },
      data: { status: "accepted" }
    });
    await prisma.friendship.create({
      data: { userId1: senderId, userId2: receiverId }
    });
    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept friend request error:", error);
    res.status(400).json({ message: "Failed to accept friend request" });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId1, userId2 },
          { userId1: userId2, userId2: userId1 }
        ]
      }
    });
    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Remove friend error:", error);
    res.status(400).json({ message: "Failed to remove friend" });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: "pending",
      },
      include: {
        sender: true,
      },
    });

    if (pendingRequests.length === 0) {
      return res.status(200).json({ message: "No pending friend requests." });
    }

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(400).json({ message: "Failed to get pending friend requests." });
  }
};

exports.checkFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Check friend request error:", error);
    res.status(400).json({ message: "Failed to check friend requests" });
  }
};
