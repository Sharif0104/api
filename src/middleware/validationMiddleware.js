const { validationResult } = require("express-validator");

exports.validationMiddleware = function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

exports.validateConversation = function (req, res, next) {
  const { user1Id, user2Id } = req.body;
  if (!user1Id || !user2Id) {
    return res.status(400).json({ error: "Both user1Id and user2Id are required." });
  }
  next();
};

exports.validateMessage = function (req, res, next) {
  const { userId, content } = req.body;
  if (!userId || !content?.trim()) {
    return res.status(400).json({ error: "userId and content are required." });
  }
  next();
};
