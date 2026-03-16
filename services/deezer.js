const DeezerPublicApi = require('deezer-public-api');
const deezer = new DeezerPublicApi();

//Search for tracks
async function searchTracks(query, limit) {
    if (limit === undefined) {
        limit = 10;
    }

    try {
        const results = await deezer.search.track(query, { limit: limit });

        if (results.data) {
            return results.data;
        } else {
            return [];
        }
        } catch (error) {
            console.log('Deezer track error:', error);
            return null;
        }
    }

    //GET track by ID
    async function getTrack(trackID) {
        try {
            const track = await deezer.track(trackID);
            return track;
        } catch (error) {
            console.log('Deezer track error:', error);
            return null;
        }
    }

    // GET artist by ID
    async function getArtist(artistId) {
        try {
            const artist = await deezer.artist(artistId);
            return artist;
        } catch (error) {
            console.log('Deezer artist error:', error);
            return null;
        }   
    }

    async function searchArtists(query, limit) {
        if (limit === undefined) {
        limit = 10;
    }

    try {
        const results = await deezer.search.artist(query, { limit: limit });

        if (results.data) {
            return results.data;
        } else {
            return[];
        }
        } catch (error) {
            console.log('Deezer track error:', error);
            return null
        }
    }

// EXPORT all functions

module.exports = {
    searchTracks: searchTracks,
    getTrack: getTrack,
    getArtist: getArtist,
    searchArtists: searchArtists
};