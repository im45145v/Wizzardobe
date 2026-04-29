require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/wardrobe', require('./routes/wardrobe'));
app.use('/api/outfits', require('./routes/outfits'));
app.use('/api/laundry', require('./routes/laundry'));
app.use('/api/shopping', require('./routes/shopping'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/stylist', require('./routes/stylist'));
app.use('/api/calendar', require('./routes/calendar'));

app.get('/health', (req, res) => res.json({ success: true, message: 'Server is healthy' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      const port = process.env.PORT || 5000;
      app.listen(port, () => console.log(`Server running on port ${port}`));
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

module.exports = app;
