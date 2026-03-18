const Track = require('../models/track');

async function checkTrackLimit(req, res, next) {
    try {
        const trackCount = await Track.countDocuments({ owner: req.session.user._id });
        const limit = 5; // Beta limit
        
        if (trackCount >= limit) {
            return res.render('tracks/limit-reached.ejs', {
                trackCount: trackCount,
                limit: limit
            });
        }
        next();
    } catch (error) {
        console.log(error);
        next();
    }
}

module.exports = checkTrackLimit;