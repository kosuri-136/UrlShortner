const express = require('express');
const mongoose = require('mongoose');
const validUrl = require('valid-url');
const shortid = require('shortid');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection setup
const MONGODB_URI = 'mongodb'; // Replace with your MongoDB connection string
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once('open', () => console.log('Connected to MongoDB'));

// Create a URL model for MongoDB
const UrlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
});
const UrlModel = mongoose.model('Url', UrlSchema);

// Middleware for parsing JSON
app.use(express.json());

// Shorten URL route
app.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;

  // Check if the URL is valid
  if (!validUrl.isWebUri(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    // Check if the URL already exists in the database
    let url = await UrlModel.findOne({ originalUrl });

    if (url) {
      res.json(url);
    } else {
      // Generate a short URL
      const shortUrl = shortid.generate();
      const newUrl = new UrlModel({
        originalUrl,
        shortUrl,
      });
      await newUrl.save();
      res.json(newUrl);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Redirect to the original URL when accessing the short URL
app.get('/shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await UrlModel.findOne({ shortUrl });

    if (url) {
      res.redirect(url.originalUrl);
    } else {
      res.status(404).json({ error: 'URL not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
