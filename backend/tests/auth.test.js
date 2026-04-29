process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_that_is_long_enough_32chars';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_long_enough';
process.env.MASTER_ENCRYPTION_KEY = 'a'.repeat(64);

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    connection: { dropDatabase: jest.fn().mockResolvedValue(true) },
  };
});

// Prefix with 'mock' to satisfy jest.mock() factory scope rules
const mockUsers = new Map();
let mockUserIdCounter = 1;

jest.mock('../src/models/User', () => {
  const bcrypt = require('bcryptjs');

  function MockUserDoc(data) {
    Object.assign(this, data);
    this._id = String(mockUserIdCounter++);
    this.id = this._id;
    this.settings = data.settings || {
      cooldownDays: 3,
      wearBeforeDirty: { top: 3, bottom: 3, innerwear: 1, shoes: 5, outerwear: 7 },
      laundryAlertDays: 10,
    };
    this.profile = data.profile || {};
    this.openaiApiKey = data.openaiApiKey || null;
    this.save = jest.fn().mockResolvedValue(this);
    this.comparePassword = (pwd) => bcrypt.compare(pwd, this.password);
    this.toObject = () => ({ ...this });
  }

  const MockUser = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn().mockImplementation(async (data) => {
      const user = new MockUserDoc(data);
      mockUsers.set(user.email, user);
      mockUsers.set(user._id, user);
      return user;
    }),
  };

  const makeSelectable = (resolveValue) => {
    const p = Promise.resolve(resolveValue);
    p.select = jest.fn().mockReturnValue(p);
    return p;
  };

  MockUser.findOne.mockImplementation((query) => {
    const result = (query.email ? mockUsers.get(query.email) : null) || null;
    return makeSelectable(result);
  });
  MockUser.findById.mockImplementation((id) => makeSelectable(mockUsers.get(String(id)) || null));
  MockUser.findByIdAndUpdate.mockImplementation(async (id, update) => {
    const user = mockUsers.get(String(id));
    if (user) Object.assign(user, update);
    return user;
  });

  return MockUser;
});

const request = require('supertest');
const app = require('../src/server');

beforeEach(() => {
  mockUsers.clear();
  mockUserIdCounter = 1;

  const User = require('../src/models/User');
  const makeSelectable = (val) => {
    const p = Promise.resolve(val);
    p.select = jest.fn().mockReturnValue(p);
    return p;
  };
  User.findOne.mockImplementation((query) => {
    const result = (query && query.email ? mockUsers.get(query.email) : null) || null;
    return makeSelectable(result);
  });
  User.findById.mockImplementation((id) => makeSelectable(mockUsers.get(String(id)) || null));
});

describe('Auth', () => {
  const userData = { email: 'test@example.com', password: 'password123', name: 'Test User' };

  test('POST /api/auth/register creates user and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send(userData);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(userData.email);
  });

  test('POST /api/auth/register fails with duplicate email', async () => {
    await request(app).post('/api/auth/register').send(userData);
    const res = await request(app).post('/api/auth/register').send(userData);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register fails with invalid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login returns JWT', async () => {
    await request(app).post('/api/auth/register').send(userData);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /api/auth/login fails with wrong password', async () => {
    await request(app).post('/api/auth/register').send(userData);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/profile without token returns 401', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/profile with valid token returns profile', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(userData);
    const token = registerRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(userData.email);
  });

  test('POST /api/auth/refresh returns new token', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(userData);
    const { refreshToken } = registerRes.body.data;

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });
});
