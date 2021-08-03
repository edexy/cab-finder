const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userSchema = Schema({
    name: { type: String },
    phone_number: { type: String },
    email: { type: String },
    license_number: { type: String },
    car_number: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },

}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('User', userSchema);