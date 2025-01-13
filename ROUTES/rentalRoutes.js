const express = require('express');
const router = express.Router();
const rentalController = require('../CONTROLLERS/rentalHistoryController');

// Route to create a rental history
router.post('/create', rentalController.createRentalHistory);

// Route to get rental history for a user by name
router.get('/user-history/:name', rentalController.getRentalHistoryForUser);

// Route to get rental history for a vehicle by make
router.get('/vehicle-history/:make', rentalController.getRentalHistoryForVehicle);

// Route to mark a rental as completed
router.post('/complete/:rentalId', rentalController.completeRental);

module.exports = router;
