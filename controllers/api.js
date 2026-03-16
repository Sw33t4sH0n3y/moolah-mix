const express = require('express');
const router = express.Router();

router.get('/deezer/search', async (req, res) => {
    const query = req.query.q || '';

    try {
        if (!query) {
            return res.render('tracks/new.ejs', {query: '', data: [] });
        }
        const response = await fetch('https://api.deezer.com/search?q=' + encodeURIComponent(query));
        const data = await response.json();
        
        console.log(data);
        res.render('tracks/new.ejs', { query, data: data.data });
    } catch (error) {
        console.log (error);
        res.render('tracks/new.ejs', { query, data: [], error: 'Search failed' });
    }
});

//GET api/deezer/track/:id
router.get('/deezer/track/:id', async (req, res) => {
    try {
        const response = await fetch('https://api.deezer.com/track' + req.params.id);
        const data = await response.json();
        
        req.render('tracks/new.ejs', { query: '', data: [data] });
    } catch (error) {
        console.log (error);
        res.render('tracks/new.ejs', { query: '', data: [], error: 'Failed to find track' });
    }
});

//GET /api/deezer/artist/:id
router.get('/deezer/artist/:id', async (req, res) => {
    try {
        const response = await fetch('https://api.deezer.com/artist' + req.params.id);
        const data = await response.json();
        
        req.render('tracks/new.ejs', { query: '', data: [data] });
    } catch (error) {
        console.log (error);
        res.render('tracks/new.ejs', { query: '', data: [], error: 'Failed to find artist' });
    }
});

module.exports = router;