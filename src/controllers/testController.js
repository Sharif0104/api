exports.echoRequestBody = (req, res) => {
  console.log('Echo endpoint hit. Request body:', req.body);
  res.json({ receivedBody: req.body });
};
