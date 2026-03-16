const mongoose = require('mongoose');

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
        publisherIpi: String
    }],
    splits: {
        master: {
            user: {
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
        user: {
            type: Number,
            default: 100
    },       
        collaborators: {
            type: Map,
            of: Number,
            default: {}
           }
        }
    }
 }, { 
    timestamps: true
});

module.exports = mongoose.model('Track', trackSchema);