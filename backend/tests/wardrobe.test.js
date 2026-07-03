process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_that_is_long_enough_32chars';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_long_enough';
process.env.MASTER_ENCRYPTION_KEY = 'a'.repeat(64);

jest.mock('../src/services/visionService', () => ({
  autoTagCloth: jest.fn().mockResolvedValue({
    category: 'top',
    color: 'blue',
    style: 'casual',
    fabric: 'cotton',
    occasion: 'casual',
    confidence: 0.9,
  }),
}));

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    connection: { dropDatabase: jest.fn().mockResolvedValue(true) },
  };
});

// Prefixed with 'mock' to satisfy jest.mock() factory scope rules
const mockUsers = new Map();
const mockCloths = new Map();
let mockUserIdCounter = 100;
let mockClothIdCounter = 1;

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

  MockUser.findOne.mockImplementation(async (query) => {
    if (query.email) return mockUsers.get(query.email) || null;
    return null;
  });
  MockUser.findById.mockImplementation(async (id) => mockUsers.get(String(id)) || null);
  MockUser.findByIdAndUpdate.mockImplementation(async (id, update) => {
    const user = mockUsers.get(String(id));
    if (user) Object.assign(user, update);
    return user;
  });

  return MockUser;
});

jest.mock('../src/models/Cloth', () => {
  function MockClothDoc(data) {
    Object.assign(this, data);
    if (!this._id) this._id = String(mockClothIdCounter++);
    this.id = this._id;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.status = data.status || 'clean';
    this.wearCount = data.wearCount || 0;
    this.daysOutsideClean = data.daysOutsideClean || 0;
    this.condition = data.condition || 'new';
    this.save = jest.fn().mockImplementation(async () => {
      mockCloths.set(this._id, this);
      return this;
    });
    this.toObject = () => ({ ...this });
  }

  const makeChain = (results) => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(results),
  });

  const MockCloth = {
    create: jest.fn().mockImplementation(async (data) => {
      const cloth = new MockClothDoc(data);
      mockCloths.set(cloth._id, cloth);
      return cloth;
    }),
    find: jest.fn().mockImplementation((query) => {
      const results = [...mockCloths.values()].filter((c) => {
        if (query.userId && String(c.userId) !== String(query.userId)) return false;
        if (query.isActive !== undefined && c.isActive !== query.isActive) return false;
        return true;
      });
      return makeChain(results);
    }),
    findOne: jest.fn().mockImplementation(async (query) => {
      return (
        [...mockCloths.values()].find((c) => {
          if (query._id && String(c._id) !== String(query._id)) return false;
          if (query.userId && String(c.userId) !== String(query.userId)) return false;
          if (query.isActive !== undefined && c.isActive !== query.isActive) return false;
          return true;
        }) || null
      );
    }),
    countDocuments: jest.fn().mockImplementation(async (query) => {
      return [...mockCloths.values()].filter((c) => {
        if (query.userId && String(c.userId) !== String(query.userId)) return false;
        if (query.isActive !== undefined && c.isActive !== query.isActive) return false;
        return true;
      }).length;
    }),
  };

  return MockCloth;
});

jest.mock('../src/models/LaundryLog', () => ({
  create: jest.fn().mockResolvedValue({}),
  findOneAndUpdate: jest.fn().mockResolvedValue({}),
}));

const request = require('supertest');
const app = require('../src/server');

let authToken;

beforeEach(async () => {
  mockUsers.clear();
  mockCloths.clear();
  mockUserIdCounter = 100;
  mockClothIdCounter = 1;

  const User = require('../src/models/User');
  User.findOne.mockImplementation(async (query) => {
    if (query.email) return mockUsers.get(query.email) || null;
    return null;
  });
  User.findById.mockImplementation(async (id) => mockUsers.get(String(id)) || null);

  const makeChain = (results) => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(results),
  });

  const Cloth = require('../src/models/Cloth');
  Cloth.find.mockImplementation((query) => {
    const results = [...mockCloths.values()].filter((c) => {
      if (query.userId && String(c.userId) !== String(query.userId)) return false;
      if (query.isActive !== undefined && c.isActive !== query.isActive) return false;
      return true;
    });
    return makeChain(results);
  });
  Cloth.findOne.mockImplementation(async (query) => {
    return (
      [...mockCloths.values()].find((c) => {
        if (query._id && String(c._id) !== String(query._id)) return false;
        if (query.userId && String(c.userId) !== String(query.userId)) return false;
        if (query.isActive !== undefined && c.isActive !== query.isActive) return false;
        return true;
      }) || null
    );
  });
  Cloth.countDocuments.mockImplementation(async (query) => {
    return [...mockCloths.values()].filter((c) => {
      if (query.userId && String(c.userId) !== String(query.userId)) return false;
      if (query.isActive !== undefined && c.isActive !== query.isActive) return false;
      return true;
    }).length;
  });

  const registerRes = await request(app).post('/api/auth/register').send({
    email: 'wardrobe@example.com',
    password: 'password123',
    name: 'Wardrobe User',
  });
  authToken = registerRes.body.data.token;
});

describe('Wardrobe', () => {
  test('POST /api/wardrobe creates cloth (no image)', async () => {
    const res = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'Blue T-Shirt')
      .field('category', 'top')
      .field('color', 'blue');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cloth.name).toBe('Blue T-Shirt');
    expect(res.body.data.cloth.category).toBe('top');
  });

  test('POST /api/wardrobe fails without required fields', async () => {
    const res = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .field('color', 'blue');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/wardrobe returns cloths', async () => {
    await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'Test Shirt')
      .field('category', 'top');

    const allCloths = [...mockCloths.values()];
    const Cloth = require('../src/models/Cloth');
    Cloth.find.mockImplementation(() => ({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(allCloths),
    }));
    Cloth.countDocuments.mockResolvedValue(allCloths.length);

    const res = await request(app)
      .get('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cloths.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/wardrobe returns empty list when no cloths', async () => {
    const res = await request(app)
      .get('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cloths).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  test('GET /api/wardrobe/:id returns single cloth', async () => {
    const createRes = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'Single Item')
      .field('category', 'bottom');

    const clothId = createRes.body.data.cloth._id;

    const res = await request(app)
      .get(`/api/wardrobe/${clothId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cloth._id).toBe(clothId);
  });

  test('PUT /api/wardrobe/:id updates cloth', async () => {
    const createRes = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'Old Name')
      .field('category', 'top');

    const clothId = createRes.body.data.cloth._id;

    const res = await request(app)
      .put(`/api/wardrobe/${clothId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'New Name', color: 'red' });

    expect(res.status).toBe(200);
    expect(res.body.data.cloth.name).toBe('New Name');
    expect(res.body.data.cloth.color).toBe('red');
  });

  test('DELETE /api/wardrobe/:id soft deletes cloth', async () => {
    const createRes = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'To Delete')
      .field('category', 'shoes');

    const clothId = createRes.body.data.cloth._id;

    const deleteRes = await request(app)
      .delete(`/api/wardrobe/${clothId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const deletedCloth = mockCloths.get(clothId);
    expect(deletedCloth.isActive).toBe(false);
  });

  test('GET /api/wardrobe without token returns 401', async () => {
    const res = await request(app).get('/api/wardrobe');
    expect(res.status).toBe(401);
  });

  test('POST /api/wardrobe/:id/worn increments wearCount', async () => {
    const createRes = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'Wearable Shirt')
      .field('category', 'top');

    const clothId = createRes.body.data.cloth._id;

    const res = await request(app)
      .post(`/api/wardrobe/${clothId}/worn`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cloth.wearCount).toBe(1);
    expect(res.body.data.cloth.lastWornDate).toBeDefined();
  });

  test('wearsSinceWash marks item dirty at threshold and clean resets cycle count', async () => {
    const createRes = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'Threshold Shirt')
      .field('category', 'top');

    const clothId = createRes.body.data.cloth._id;

    await request(app).post(`/api/wardrobe/${clothId}/worn`).set('Authorization', `Bearer ${authToken}`);
    await request(app).post(`/api/wardrobe/${clothId}/worn`).set('Authorization', `Bearer ${authToken}`);
    const dirtyRes = await request(app)
      .post(`/api/wardrobe/${clothId}/worn`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(dirtyRes.status).toBe(200);
    expect(dirtyRes.body.data.cloth.wearCount).toBe(3);
    expect(dirtyRes.body.data.cloth.wearsSinceWash).toBe(3);
    expect(dirtyRes.body.data.cloth.status).toBe('dirty');

    const cleanRes = await request(app)
      .put(`/api/wardrobe/${clothId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'clean' });

    expect(cleanRes.status).toBe(200);
    expect(cleanRes.body.data.cloth.status).toBe('clean');
    expect(cleanRes.body.data.cloth.wearsSinceWash).toBe(0);
    expect(cleanRes.body.data.cloth.wearCount).toBe(3);
  });
});
