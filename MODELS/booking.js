const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  isCanceled: { type: Boolean, default: false },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'pending' }
}, { timestamps: true },);

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
