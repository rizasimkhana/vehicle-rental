const mongoose = require('mongoose');
const Vehicle = require('./vehicleModel');
const User = require('./user');
const moment = require('moment');

const rentalHistorySchema = new mongoose.Schema({
  vehicleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  rentalStart: { 
    type: Date, 
    required: true 
  },
  rentalEnd: { 
    type: Date, 
    required: true 
  },
  rentalDuration: { 
    type: Number, 
    required: true // Duration in days
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['completed', 'ongoing', 'cancelled'], 
    default: 'ongoing' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('RentalHistory', rentalHistorySchema);
