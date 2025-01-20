// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const { createBooking, modifyBooking, cancelBooking,getBookingsByUser,getAllBookings} = require('../CONTROLLERS/bookingController');

// Route for creating a new booking
router.post('/create', createBooking);

// Route for modifying an existing booking
router.put('/modify/:id', modifyBooking);

// Route for canceling a booking
router.delete('/cancel/:id', cancelBooking);

router.get('/user/:vehicleId', getBookingsByUser);

router.get('/user/', getAllBookings);

module.exports = router;
