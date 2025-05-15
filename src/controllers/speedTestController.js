const speedTest = require('speedtest-net');

// Function to run a speed test and return the results
exports.runSpeedTest = async (req, res) => {
  try {
    const result = await speedTest({ maxTime: 5000, acceptLicense: true, acceptGdpr: true });
    res.json({
      downloadSpeed: result.download.bandwidth / 125000,
      uploadSpeed: result.upload.bandwidth / 125000,
      ping: result.ping.latency,
      server: result.server.name,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Speed test failed', message: err.message });
  }
};
