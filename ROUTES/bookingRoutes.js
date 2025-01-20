// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const { createBooking, modifyBooking, cancelBooking,getBookingsByVehicle,getAllBookings} = require('../CONTROLLERS/bookingController');

// Route for creating a new booking
router.post('/create', createBooking);

// Route for modifying an existing booking
router.put('/modify/:id', modifyBooking);

// Route for canceling a booking
router.delete('/cancel/:id', cancelBooking);

router.get('/user/:vehicleId',getBookingsByVehicle);

router.get('/user/', getAllBookings);

module.exports = router;
