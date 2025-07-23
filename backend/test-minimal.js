console.log('Testing minimal server startup...');

require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5001;

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.listen(PORT, () => {
  console.log(`✅ Minimal test server running on port ${PORT}`);
});
