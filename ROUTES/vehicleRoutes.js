// routes/vehicleRoutes.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const vehicleController = require('../CONTROLLERS/vehicleController');
const uploader = require('../MIDDLEWARE/multer');

const router = express.Router();

// Set up multer storage configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Adds timestamp to avoid conflicts
  },
});

const upload = multer({ storage: storage });

// Routes
router.post('/vehicles', upload.single('image'), vehicleController.createVehicle); // Add new vehicle
router.get('/vehicles', vehicleController.getVehicles); // Get all vehicles (with filters)
router.get('/vehicles/:id', vehicleController.getVehicleById); // Get vehicle by ID
router.delete('/vehicles/:id', vehicleController.deleteVehicle); // delete vehicle by ID
// Routes
router.put('/vehicles/:id', upload.single('image'), vehicleController.updateVehicle); // update vehicle by ID
// PATCH route to update vehicle partially
router.patch('/vehicles/:id', upload.single('image'), vehicleController.updateVehicle);



module.exports = router;
