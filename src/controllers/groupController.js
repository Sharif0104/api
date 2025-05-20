const prisma = require('../utils/prisma');

// Create a group and add only friends as members
exports.createGroup = async (req, res) => {
  const { name, memberIds } = req.body;
  const ownerId = req.user.id;

  if (!name || !Array.isArray(memberIds)) {
    return res.status(400).json({ error: 'Group name and memberIds are required.' });
  }

  // Always include the owner as a member
  const uniqueMemberIds = Array.from(new Set([...memberIds, ownerId]));

  // Check that all memberIds are friends with the owner
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: uniqueMemberIds.filter(id => id !== ownerId).map(id => ({
        OR: [
          { userId1: ownerId, userId2: id },
          { userId1: id, userId2: ownerId }
        ]
      }))
    }
  });

  const friendIds = new Set();
  friendships.forEach(f => {
    friendIds.add(f.userId1 === ownerId ? f.userId2 : f.userId1);
  });

  // Only allow adding friends
  const allowedMemberIds = uniqueMemberIds.filter(id => id === ownerId || friendIds.has(id));

  if (allowedMemberIds.length !== uniqueMemberIds.length) {
    return res.status(403).json({ error: 'You can only add your friends to the group.' });
  }

  // Create group and members in a transaction
  const group = await prisma.group.create({
    data: {
      name,
      ownerId,
      members: {
        create: allowedMemberIds.map(userId => ({ userId }))
      }
    },
    include: { members: true }
  });

  res.status(201).json({ group });
};

// Add a friend to an existing group (owner only)
exports.addGroupMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  const ownerId = req.user.id;

  const group = await prisma.group.findUnique({ where: { id: parseInt(groupId, 10) } });
  if (!group) return res.status(404).json({ error: 'Group not found.' });
  if (group.ownerId !== ownerId) return res.status(403).json({ error: 'Only the group owner can add members.' });

  // Check friendship
  const isFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId1: ownerId, userId2: userId },
        { userId1: userId, userId2: ownerId }
      ]
    }
  });
  if (!isFriend) return res.status(403).json({ error: 'You can only add your friends.' });

  // Add member
  await prisma.groupMember.create({ data: { groupId: group.id, userId } });
  res.status(201).json({ message: 'Member added.' });
};

// Send a message to a group (must be a member)
exports.sendGroupMessage = async (req, res) => {
  const { groupId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  // Check membership
  const isMember = await prisma.groupMember.findFirst({ where: { groupId: parseInt(groupId, 10), userId } });
  if (!isMember) return res.status(403).json({ error: 'You must be a group member to send messages.' });

  const message = await prisma.groupMessage.create({
    data: { groupId: parseInt(groupId, 10), userId, content }
  });
  res.status(201).json({ message });
};

// Get group messages (must be a member)
exports.getGroupMessages = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // Check membership
  const isMember = await prisma.groupMember.findFirst({ where: { groupId: parseInt(groupId, 10), userId } });
  if (!isMember) return res.status(403).json({ error: 'You must be a group member to view messages.' });

  const messages = await prisma.groupMessage.findMany({
    where: { groupId: parseInt(groupId, 10) },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' }
  });
  res.json({ messages });
};
