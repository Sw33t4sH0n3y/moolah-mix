const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    default: '',
},
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
}, {
    timestamps: true
}); 

const User = mongoose.model("User", userSchema);

module.exports = User;
