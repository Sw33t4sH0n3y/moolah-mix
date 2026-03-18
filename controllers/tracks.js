const express = require('express');
const router = express.Router();
const Track = require('../models/track');
const User = require('../models/user');
const { ROLES, PRO_OPTIONS, DAW_OPTIONS} = require('../config/constants');
const PDFDocument = require('pdfkit');
const { sendInviteEmail, sendAgreementConfirmation } = require('../services/email');
const checkTrackLimit = require('../middleware/check-limits');

// GET /tracks
router.get('/', async (req, res) => {
    try {
        const tracks = await Track.find({ owner: req.session.user._id });
        res.render('tracks/index.ejs', { tracks });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

//GET /tracks/new
router.get('/new', checkTrackLimit, (req, res) => {
    res.render('tracks/new.ejs');
});

//POST /tracks - create new track
router.post('/', checkTrackLimit, async (req, res) => {
    try {
        const trackData = {
            ...req.body,
            owner: req.session.user._id
        };
        await Track.create(trackData);
        res.redirect('/tracks');
    } catch (error) {
        console.log(error);
        res.redirect('/tracks/new');
    }
});

// GET /tracks/agree/:token - Collaborator views their split sheet
router.get('/agree/:token', async (req, res) => {
    try {
        const track = await Track.findOne({
            'collaborators.inviteToken': req.params.token
        });
        
        if (!track) {
            return res.status(404).render('error.ejs', { 
                message: 'Invalid or expired link' 
            });
        }
        
        const collaborator = track.collaborators.find(
            c => c.inviteToken === req.params.token
        );
        
        if (collaborator.status === 'pending') {
            collaborator.status = 'viewed';
            collaborator.viewedAt = new Date();
            await track.save();
        }
        
        const owner = await User.findById(track.owner);
        
        res.render('tracks/agree.ejs', { 
            track, 
            owner, 
            collaborator,
            token: req.params.token,
            ROLES 
        });
    } catch (error) {
        console.log(error);
        res.status(500).render('error.ejs', { 
            message: 'Something went wrong' 
        });
    }
});

// GET /tracks/:id/revenue - Revenue Calculator
router.get('/:id/revenue', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        const user = await User.findById(req.session.user._id);
        
        // Streaming platform payout rates (per stream, approximate)
        const platforms = {
            spotify: { name: 'Spotify', rate: 0.003, icon: '🟢' },
            apple: { name: 'Apple Music', rate: 0.01, icon: '🍎' },
            amazon: { name: 'Amazon Music', rate: 0.004, icon: '📦' },
            youtube: { name: 'YouTube Music', rate: 0.002, icon: '▶️' },
            tidal: { name: 'Tidal', rate: 0.0125, icon: '🌊' },
            deezer: { name: 'Deezer', rate: 0.0064, icon: '🎵' },
            pandora: { name: 'Pandora', rate: 0.00133, icon: '📻' }
        };
        
        res.render('tracks/revenue.ejs', { 
            track, 
            user, 
            platforms,
            ROLES 
        });
    } catch (error) {
        console.log(error);
        res.redirect('/tracks/' + req.params.id);
    }
});

// POST /tracks/agree/:token - Collaborator agrees to splits
router.post('/agree/:token', async (req, res) => {
    try {
        const track = await Track.findOne({
            'collaborators.inviteToken': req.params.token
        });
        
        if (!track) {
            return res.status(404).render('error.ejs', { 
                message: 'Invalid or expired link' 
            });
        }
        
        if (track.isLocked) {
            return res.status(400).render('error.ejs', { 
                message: 'This split sheet is already locked' 
            });
        }
        
        const collaborator = track.collaborators.find(
            c => c.inviteToken === req.params.token
        );
        
        collaborator.status = 'agreed';
        collaborator.agreedAt = new Date();
        collaborator.agreedFromIP = req.ip || req.connection.remoteAddress;

         // Save signature
        if (req.body.signature) {
            collaborator.signature = req.body.signature;
            collaborator.signatureType = req.body.signatureType || 'draw';
        }
        
        const allAgreed = track.collaborators.every(c => c.status === 'agreed');
        
        if (allAgreed) {
            track.allAgreed = true;
            track.isLocked = true;
            track.lockedAt = new Date();
        }
        
        await track.save();
        
        if (collaborator.email) {
            await sendAgreementConfirmation(collaborator, track);
        }
        
        res.render('tracks/agreed.ejs', { 
            track, 
            collaborator 
        });
    } catch (error) {
        console.log(error);
        res.status(500).render('error.ejs', { 
            message: 'Something went wrong' 
        });
    }
});

// GET /tracks/:id/share - Public view (no Login required)
router.get('/:id/share', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        if (!track) {
            return res.status(404).render('error.ejs', { message: 'Track not found' });
        }
        const owner = await User.findById(track.owner);
        res.render('tracks/share.ejs', { track, owner, ROLES });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

// GET /tracks/:id/collaborators - View all
router.get('/:id/collaborators', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        const user = await User.findById(req.session.user._id);
        res.render('tracks/collaborators/index.ejs', { 
            track, 
            user, 
            ROLES,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.log(error);
        res.redirect('/tracks/' + req.params.id);
    }
});

// GET /tracks/:id/collaborators/new
router.get('/:id/collaborators/new', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        res.render('tracks/collaborators/new.ejs', { track, ROLES, PRO_OPTIONS, DAW_OPTIONS });
    } catch (error) {
        console.log(error);
        res.redirect('/tracks/' + req.params.id);
    }
});

// POST /tracks/:id/collaborators - Create
router.post('/:id/collaborators', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        const user = await User.findById(req.session.user._id);
        
        let roles = [];
        if (req.body.roles) {
            if (Array.isArray(req.body.roles)) {
                roles = req.body.roles.filter(r => typeof r === 'string');
            } else if (typeof req.body.roles === 'string') {
                roles = [req.body.roles];
            }
        }
        
        const collaboratorData = {
            name: req.body.name,
            email: req.body.email || '',
            roles: roles,
            stageName: req.body.stageName || '',
            genre: req.body.genre || '',
            producerTag: req.body.producerTag || '',
            daw: req.body.daw || '',
            writerPro: req.body.writerPro || '',
            writerIpi: req.body.writerIpi || '',
            publishingCompany: req.body.publishingCompany || '',
            publisherPro: req.body.publisherPro || '',
            publisherIpi: req.body.publisherIpi || ''
        };
        
        track.collaborators.push(collaboratorData);
        await track.save();
        
        const newCollab = track.collaborators[track.collaborators.length - 1];
        if (newCollab.email) {
            const ownerName = user.displayName || user.username;
            const result = await sendInviteEmail(newCollab, track, ownerName, newCollab.inviteToken);
            if (result.success) {
                newCollab.inviteSentAt = new Date();
                await track.save();
            }
        }
        
        res.redirect('/tracks/' + req.params.id);
    } catch (error) {
        console.log(error);
        res.redirect('/tracks/' + req.params.id);
    }   
});

// POST /tracks/:id/collaborators/:collabId/send-invite - Send/Resend invite email
router.post('/:id/collaborators/:collabId/send-invite', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        const user = await User.findById(req.session.user._id);
        const collaborator = track.collaborators.id(req.params.collabId);
        
        if (!collaborator.email) {
            return res.redirect('/tracks/' + req.params.id + '/collaborators?error=No email address');
        }
        
        const ownerName = user.displayName || user.username;
        const result = await sendInviteEmail(collaborator, track, ownerName, collaborator.inviteToken);
        
        if (result.success) {
            collaborator.inviteSentAt = new Date();
            await track.save();
            res.redirect('/tracks/' + req.params.id + '/collaborators?success=Invite sent to ' + collaborator.email);
        } else {
            res.redirect('/tracks/' + req.params.id + '/collaborators?error=Failed to send: ' + result.error);
        }
    } catch (error) {
        console.log(error);
        res.redirect('/tracks/' + req.params.id + '/collaborators?error=Failed to send');
    }
});

// GET /tracks/:id/collaborators/:collabId/edit
router.get('/:id/collaborators/:collabId/edit', async (req, res) => {
    try {   
        const track = await Track.findById(req.params.id);
        const collaborator = track.collaborators.id(req.params.collabId);
        res.render('tracks/collaborators/edit.ejs', { track, collaborator, ROLES, PRO_OPTIONS, DAW_OPTIONS });
    } catch (error) {
        console.log(error);
        res.redirect('/tracks/' + req.params.id);
    }       
});

// PUT /tracks/:id/collaborators/:collabId - Update
router.put('/:id/collaborators/:collabId', async (req, res) => {
    try {   
        const track = await Track.findById(req.params.id);
        const collaborator = track.collaborators.id(req.params.collabId);
        
        // Fix roles format
        let roles = [];
        if (req.body.roles) {
            if (Array.isArray(req.body.roles)) {
                roles = req.body.roles.filter(r => typeof r === 'string');
            } else if (typeof req.body.roles === 'string') {
                roles = [req.body.roles];
            }
        }
        req.body.roles = roles;
        
        Object.assign(collaborator, req.body);
        await track.save();
        res.redirect('/tracks/' + req.params.id);
    } catch (error) {
        console.log(error);
        res.redirect('/tracks/' + req.params.id);
    }       
});

// DELETE /tracks/:id/collaborators/:collabId
router.delete('/:id/collaborators/:collabId', async (req, res) => {
    try {   
        const track = await Track.findById(req.params.id);
        track.collaborators.pull({ _id: req.params.collabId });
        await track.save();
        res.redirect('/tracks/' + req.params.id);
    } catch (error) {
        console.log(error);
        res.redirect('/tracks/' + req.params.id);
    }       
});

// PUT /tracks/:id/splits - Update splits
router.put('/:id/splits', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        
        if (!track.splits) {
            track.splits = {
                master: { owner: 0, collaborators: new Map() },
                publishing: { owner: 0, collaborators: new Map() }
            };
        }
        
        track.splits.master.owner = parseInt(req.body.masterOwner) || 0;
        track.splits.publishing.owner = parseInt(req.body.publishingOwner) || 0;

        if (track.collaborators) {
            track.collaborators.forEach(collab => {
                const collabId = collab._id.toString();

                const masterKey = 'master_' + collabId;
                if (req.body[masterKey] !== undefined) {
                    track.splits.master.collaborators.set(collabId, parseInt(req.body[masterKey]) || 0);
                }
                
                const pubKey = 'publishing_' + collabId;
                if (req.body[pubKey] !== undefined) {
                    track.splits.publishing.collaborators.set(collabId, parseInt(req.body[pubKey]) || 0);
                }
            });
        }
    
        await track.save();
        res.redirect('/tracks/' + req.params.id + '?success=Splits saved');
    } catch (error) {
        console.log(error);
        res.redirect('/tracks/' + req.params.id);
    }    
});

// GET /tracks/:id/pdf
router.get('/:id/pdf', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        const user = await User.findById(track.owner);

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename:"${track.title}-split-sheet.pdf"`);

        doc.pipe(res);

        doc.fontSize(24).font('Helvetica-Bold').text('SPLIT SHEET', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text('Generated by Moolah M$x', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(18).font('Helvetica-Bold').text(track.title, { align: 'center' });
        doc.moveDown(0.5);

        if (track.status) {
            doc.fontSize(11).font('Helvetica').text(`Status: ${track.status.charAt(0).toUpperCase() + track.status.slice(1)}`, { align: 'center' });
        }    
        if (track.isrc) {
            doc.text(`ISRC: ${track.isrc}`, { align: 'center' });    
        }
        if (track.releaseDate) {
            doc.text(`Release Date: ${new Date(track.releaseDate).toLocaleDateString()}`, { align: 'center' });
        }
        doc.moveDown(2);

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1.5);

        doc.fontSize(14).font('Helvetica-Bold').text('MASTER RECORDING OWNERSHIP');
        doc.moveDown(0.5);

        const masterOwnerPct = track.splits?.master?.owner ?? 100;
        doc.fontSize(11).font('Helvetica');
        doc.text(`${user.displayName || user.username} (Owner): ${masterOwnerPct}%`);

        let masterTotal = masterOwnerPct;

        if (track.collaborators && track.collaborators.length > 0) {
            track.collaborators.forEach(collab => {
                const collabId = collab._id.toString();
                const pct = track.splits?.master?.collaborators?.get(collabId) || 0;
                masterTotal += pct;
                doc.text(`${collab.name}: ${pct}%`);
            });
        }
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text(`TOTAL: ${masterTotal}%`);
        doc.moveDown(2);

        doc.fontSize(14).font('Helvetica-Bold').text('PUBLISHING OWNERSHIP');
        doc.moveDown(0.5);

        const pubOwnerPct = track.splits?.publishing?.owner ?? 100;
        doc.fontSize(11).font('Helvetica');
        doc.text(`${user.displayName || user.username} (Owner): ${pubOwnerPct}%`);

        let pubTotal = pubOwnerPct;

        if (track.collaborators && track.collaborators.length > 0) {
            track.collaborators.forEach(collab => {
                const collabId = collab._id.toString();
                const pct = track.splits?.publishing?.collaborators?.get(collabId) || 0;
                pubTotal += pct;
                doc.text(`${collab.name}: ${pct}%`);
            });
        }
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text(`TOTAL: ${pubTotal}%`);
        doc.moveDown(2);

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1.5);


doc.fontSize(14).font('Helvetica-Bold').text('SIGNATURES');
doc.moveDown(1);

// Owner signature (placeholder - you could add owner signing later)
doc.fontSize(10).font('Helvetica');
doc.text(`${user.displayName || user.username} (Owner)`);
doc.moveDown(0.3);
doc.text('Signature: ____________________________    Date: ______________');
doc.moveDown(1.5);

// Collaborator signatures
if (track.collaborators && track.collaborators.length > 0) {
    for (const collab of track.collaborators) {
        doc.text(`${collab.name}`);
        doc.moveDown(0.3);
        
        if (collab.signature && collab.status === 'agreed') {
            // Add actual signature image
            try {
                const signatureData = collab.signature.replace(/^data:image\/\w+;base64,/, '');
                const signatureBuffer = Buffer.from(signatureData, 'base64');
                doc.image(signatureBuffer, { width: 150, height: 50 });
                doc.moveDown(0.3);
                doc.fontSize(8).text(`Signed: ${new Date(collab.agreedAt).toLocaleString()}`, { color: 'gray' });
                doc.fontSize(10);
            } catch (err) {
                doc.text('Signature: [Signed electronically]');
            }
        } else {
            doc.text('Signature: ____________________________    Date: ______________');
        }
        doc.moveDown(1.5);
    }
}
        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica').text(`This document was generated on ${new Date().toLocaleDateString()} via Moolah M$x.`, { align: 'center' }); 
        doc.text('All parties should retain a copy for their records.', { align: 'center' });

        doc.end();

    } catch (error) {
        console.log(error);
        res.redirect('/tracks/' + req.params.id);
    }
});   

// GET /tracks/:id
router.get('/:id', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        const user = await User.findById(req.session.user._id);
        res.render('tracks/show.ejs', { 
            track, 
            user, 
            ROLES, 
            success: req.query.success || null, 
            error: req.query.error || null 
        });
    } catch (error) {
        console.log(error);
        res.redirect('/tracks');
    }
});

// GET /tracks/:id/edit
router.get('/:id/edit', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        res.render('tracks/edit.ejs', { track });
    } catch (error) {
        console.log(error);
        res.redirect('/tracks');
    }
});

// PUT /tracks/:id
router.put('/:id', async (req, res) => {
    try {
        await Track.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/tracks/' + req.params.id);
    } catch (error) {
        console.log(error);
        res.redirect('/tracks');
    }
});

// DELETE /tracks/:id
router.delete('/:id', async (req, res) => {
    try {
        await Track.findByIdAndDelete(req.params.id);
        res.redirect('/tracks');
    } catch (error) {
        console.log(error);
        res.redirect('/tracks');
    }
});

module.exports = router;