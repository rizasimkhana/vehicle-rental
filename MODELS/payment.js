const mongoose = require('mongoose');

// Define the Payment Schema
const paymentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User',
    required: true // assuming there is a 'User' model to associate payments with users
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    required: true, // e.g., 'UPI', 'Credit Card'
    enum: ['UPI', 'Credit Card'], // Only 'UPI' and 'Credit Card'
  },
  status: { 
    type: String, 
    enum: ['Completed', 'Failed', 'Pending'], 
    default: 'Completed' 
  },
  transactionId: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  date: { type: Date, default: Date.now },
});

// Create the Payment model from the schema
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
