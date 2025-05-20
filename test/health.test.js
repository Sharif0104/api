const request = require('supertest');
const app = require('../server');

describe('Professional API Health & System Endpoints', () => {
  const apiKey = process.env.API_KEY || 'sample';
  const reqWithApiKey = (url) => request(app).get(url).set('x-api-key', apiKey);

  it('GET /api should return health status and system info', async () => {
    const res = await reqWithApiKey('/api');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('memory');
    expect(res.body).toHaveProperty('cpuLoad');
    expect(res.body).toHaveProperty('platform');
    expect(res.body).toHaveProperty('arch');
  });

  it('GET /api/live should confirm liveness', async () => {
    const res = await reqWithApiKey('/api/live');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('alive');
  });
});
