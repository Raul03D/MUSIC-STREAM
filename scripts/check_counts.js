require('dotenv').config();
const mongoose = require('mongoose');
const Music = require('../src/models/music.model');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await Music.countDocuments();
  console.log('Total songs in DB:', total);
  const byGenre = await Music.aggregate([
    { $group: { _id: '$genre', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log('By genre:', JSON.stringify(byGenre, null, 2));
  await mongoose.disconnect();
}
check().catch(console.error);
