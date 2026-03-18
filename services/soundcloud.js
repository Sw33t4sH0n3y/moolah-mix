const { Client } = require('soundcloud-scraper');
const client = new Client();

// Search for tracks
async function searchTracks(query, limit) {
    limit = limit || 5;
    try {
        const results = await client.search(query, 'track');
        
        // Debug - log first result to see structure
        if (results && results.length > 0) {
            console.log('SoundCloud result structure:', JSON.stringify(results[0], null, 2));
        }
        
        const tracks = [];
        
        for (let i = 0; i < Math.min(results.length, limit); i++) {
            const track = results[i];
            if (!track) continue;
            
            tracks.push({
                id: track.id || '',
                title: track.name || track.title || 'Unknown Title',
                artist: (track.author && track.author.name) || track.artist || track.username || 'Unknown Artist',
                artistUrl: (track.author && track.author.url) || '',
                duration: track.duration || 0,
                durationFormatted: formatDuration(track.duration || 0),
                artwork: track.thumbnail || track.artwork_url || '',
                url: track.url || '',
                playCount: track.playCount || track.plays || 0,
                likes: track.likes || 0,
                genre: track.genre || '',
                createdAt: track.createdAt || ''
            });
        }
        
        return { success: true, tracks: tracks };
    } catch (error) {
        console.log('SoundCloud search error:', error.message);
        return { success: false, error: error.message, tracks: [] };
    }
}

// Get track info from URL
async function getTrackFromUrl(url) {
    try {
        const track = await client.getSongInfo(url);
        
        // Debug
        console.log('SoundCloud track structure:', JSON.stringify(track, null, 2));
        
        return {
            success: true,
            track: {
                id: track.id || '',
                title: track.title || track.name || 'Unknown Title',
                artist: (track.author && track.author.name) || track.artist || track.username || 'Unknown Artist',
                artistUrl: (track.author && track.author.url) || '',
                duration: track.duration || 0,
                durationFormatted: formatDuration(track.duration || 0),
                artwork: track.thumbnail || track.artwork_url || '',
                url: track.url || url,
                playCount: track.playCount || track.plays || 0,
                likes: track.likes || 0,
                genre: track.genre || '',
                description: track.description || '',
                createdAt: track.createdAt || ''
            }
        };
    } catch (error) {
        console.log('SoundCloud URL error:', error.message);
        return { success: false, error: 'Could not find track. Check the URL.' };
    }
}

// Get stream count for revenue calculator
async function getStreamCount(url) {
    try {
        const track = await client.getSongInfo(url);
        return {
            success: true,
            playCount: track.playCount || track.plays || 0,
            title: track.title || track.name || '',
            artist: (track.author && track.author.name) || track.artist || ''
        };
    } catch (error) {
        console.log('SoundCloud stream count error:', error.message);
        return { success: false, error: error.message, playCount: 0 };
    }
}

// Format duration from ms to MM:SS
function formatDuration(ms) {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

module.exports = {
    searchTracks: searchTracks,
    getTrackFromUrl: getTrackFromUrl,
    getStreamCount: getStreamCount
};