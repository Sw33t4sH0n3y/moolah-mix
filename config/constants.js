const ROLES = {
    artist: {
        label: 'Artist', 
        icon: '🎤'
    },
    producer: {
      label: 'Producer',
      icon: '🎛️'  
    },
    writer: {
        label: 'Writer',
        icon: '✍️'
    },
    publisher: {
        label: 'Publisher',
        icon: '📄'
    }
};    

const PRO_OPTIONS = ['ASCAP', 'BMI', 'SESAC', 'SOCAN', 'PRS', 'GEMA', 'SACEM', 'Other'];

const DAW_OPTIONS = ['Ableton Live', 'FL Studio', 'Logic Pro', 'Pro Tools', 'Studio One', 'Cubase', 'Other'];

module.exports = { ROLES, PRO_OPTIONS, DAW_OPTIONS};