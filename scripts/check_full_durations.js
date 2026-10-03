require('dotenv').config();
const mongoose = require('mongoose');
const Music = require('../src/models/music.model');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const sample = await Music.aggregate([
    {
      $group: {
        _id: '$genre',
        count: { $sum: 1 },
        minDuration: { $min: '$duration' },
        maxDuration: { $max: '$duration' },
        avgDuration: { $avg: '$duration' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  console.log('--- DATABASE FULL-LENGTH SONGS REPORT ---');
  sample.forEach(g => {
    const minM = Math.floor(g.minDuration / 60) + 'm ' + (g.minDuration % 60) + 's';
    const maxM = Math.floor(g.maxDuration / 60) + 'm ' + (g.maxDuration % 60) + 's';
    const avgM = Math.floor(g.avgDuration / 60) + 'm ' + Math.round(g.avgDuration % 60) + 's';
    console.log(g._id.padEnd(12) + ': ' + g.count + ' songs | Min: ' + minM.padEnd(8) + ' | Max: ' + maxM.padEnd(8) + ' | Avg: ' + avgM);
  });
  await mongoose.disconnect();
}
check();
