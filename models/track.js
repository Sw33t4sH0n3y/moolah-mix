const mongoose = require('mongoose');
const crypto = require('crypto')

const trackSchema = new mongoose.Schema({
    title: {
        type: String,
        default: '',
    },
    releaseDate: {
        type: String,
        default: '',
    },
    isrc: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        default: 'draft',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    collaborators: [{
        name: String,
        email: String,
        roles: [String],
        stageName: String,
        genre: String,
        producerTag: String,
        daw: String,
        writerPro: String,
        writerIpi: String,
        publishingCompany: String,
        publisherPro: String,
        publisherIpi: String,

        status: {
            type: String,
            enum: ['pending', 'viewed', 'agreed', 'disputed'],
            default: 'pending'
        },
        inviteToken: {
            type: String,
            default: function() {
                return crypto.randomBytes(16).toString('hex');
            }
        },
        viewedAt: Date,
        agreedAt: Date,
        agreedFromIP: String    
    }],
    splits: {
        master: {
            owner: {
                type: Number,
                default: 100
            },
            collaborators: {
                type: Map,
                of: Number,
                default: {}
            }    
    },
    publishing: {
        owner: {
            type: Number,
            default: 100
    },       
        collaborators: {
            type: Map,
            of: Number,
            default: {}
           }
        }
    },
    isLockedAt: Date,
    allAgreed: {
        type: Boolean,
        default: false
     }
 }, { 
    timestamps: true
});

module.exports = mongoose.model('Track', trackSchema);