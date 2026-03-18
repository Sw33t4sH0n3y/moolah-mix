const express = require('express');
const router = express.Router();
const soundcloud = require('../services/soundcloud');

// Search SoundCloud tracks
router.get('/soundcloud/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.json({ success: false, error: 'No search query provided', tracks: [] });
    }
    
    const results = await soundcloud.searchTracks(query, 5);
    res.json(results);
});

// Get track info from SoundCloud URL
router.get('/soundcloud/track', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.json({ success: false, error: 'No URL provided' });
    }
    
    // Validate it's a SoundCloud URL
    if (!url.includes('soundcloud.com')) {
        return res.json({ success: false, error: 'Not a valid SoundCloud URL' });
    }
    
    const result = await soundcloud.getTrackFromUrl(url);
    res.json(result);
});

// Get stream count from SoundCloud URL
router.get('/soundcloud/streams', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.json({ success: false, error: 'No URL provided' });
    }
    
    const result = await soundcloud.getStreamCount(url);
    res.json(result);
});

module.exports = router;