const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  availability: { type: Boolean, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: false },
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;