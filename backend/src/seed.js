require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wizzardobe';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  profile: {
    gender: String,
    bodyType: String,
    stylePreference: String,
    occasions: [String],
  },
}, { timestamps: true });

const clothingSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  category: String,
  color: String,
  material: String,
  occasions: [String],
  status: { type: String, default: 'clean' },
  wearCount: { type: Number, default: 0 },
  purchasePrice: Number,
  lastStatusChange: Date,
}, { timestamps: true });

const laundryLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  clothingId: mongoose.Schema.Types.ObjectId,
  status: String,
  changedAt: Date,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Clothing = mongoose.model('Clothing', clothingSchema);
const LaundryLog = mongoose.model('LaundryLog', laundryLogSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Clothing.deleteMany({});
  await LaundryLog.deleteMany({});

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const user1 = await User.create({
    name: 'Alex Demo',
    email: 'demo@wizzardobe.com',
    password: hash('demo1234'),
    profile: { gender: 'male', bodyType: 'athletic', stylePreference: 'casual', occasions: ['uni', 'gym', 'casual'] },
  });

  const user2 = await User.create({
    name: 'Jordan Style',
    email: 'fashionista@wizzardobe.com',
    password: hash('fashion1234'),
    profile: { gender: 'non-binary', bodyType: 'slim', stylePreference: 'minimalist', occasions: ['party', 'formal', 'work'] },
  });

  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400000);

  const clothes1 = await Clothing.insertMany([
    { userId: user1._id, name: 'White Oxford Shirt', category: 'top', color: 'white', material: 'cotton', occasions: ['formal', 'work'], status: 'clean', wearCount: 5, purchasePrice: 45 },
    { userId: user1._id, name: 'Navy Slim Jeans', category: 'bottom', color: 'navy', material: 'denim', occasions: ['casual', 'uni'], status: 'clean', wearCount: 12, purchasePrice: 60 },
    { userId: user1._id, name: 'Grey Hoodie', category: 'top', color: 'grey', material: 'fleece', occasions: ['casual', 'gym'], status: 'dirty', wearCount: 20, purchasePrice: 35, lastStatusChange: daysAgo(5) },
    { userId: user1._id, name: 'Black Chinos', category: 'bottom', color: 'black', material: 'cotton', occasions: ['formal', 'work'], status: 'clean', wearCount: 8, purchasePrice: 55 },
    { userId: user1._id, name: 'White Sneakers', category: 'shoes', color: 'white', material: 'leather', occasions: ['casual', 'uni'], status: 'clean', wearCount: 30, purchasePrice: 80 },
    { userId: user1._id, name: 'Black Formal Shoes', category: 'shoes', color: 'black', material: 'leather', occasions: ['formal', 'work'], status: 'clean', wearCount: 3, purchasePrice: 120 },
    { userId: user1._id, name: 'Denim Jacket', category: 'outerwear', color: 'blue', material: 'denim', occasions: ['casual', 'uni'], status: 'clean', wearCount: 6, purchasePrice: 75 },
    { userId: user1._id, name: 'Navy Suit Jacket', category: 'outerwear', color: 'navy', material: 'wool', occasions: ['formal', 'work'], status: 'in_wash', wearCount: 2, purchasePrice: 200, lastStatusChange: daysAgo(12) },
  ]);

  await Clothing.insertMany([
    { userId: user2._id, name: 'Black Turtleneck', category: 'top', color: 'black', material: 'merino wool', occasions: ['minimalist', 'work'], status: 'clean', wearCount: 15, purchasePrice: 65 },
    { userId: user2._id, name: 'White Wide-leg Trousers', category: 'bottom', color: 'white', material: 'linen', occasions: ['minimalist', 'formal'], status: 'clean', wearCount: 4, purchasePrice: 85 },
  ]);

  const dirtyItems = clothes1.filter(c => c.status === 'dirty' || c.status === 'in_wash');
  await LaundryLog.insertMany(dirtyItems.map(c => ({
    userId: user1._id,
    clothingId: c._id,
    status: c.status,
    changedAt: c.lastStatusChange,
  })));

  console.log('✅ Seed complete:');
  console.log('  Users: 2 (demo@wizzardobe.com / demo1234, fashionista@wizzardobe.com / fashion1234)');
  console.log('  Clothes for User 1: 8');
  console.log('  Clothes for User 2: 2');
  console.log('  LaundryLog entries:', dirtyItems.length);
  console.log('  ⚠️  Navy Suit Jacket is OVERDUE in_wash (12 days)');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
