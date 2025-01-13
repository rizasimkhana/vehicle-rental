const RentalHistory = require('../MODELS/rentalHistory');
const Vehicle = require('../MODELS/vehicleModel');
const User = require('../MODELS/user');
const moment = require('moment');

// Controller to create a rental history
exports.createRentalHistory = async (req, res) => {
  const { name, make, rentalStart, rentalEnd } = req.body;

  try {
    // Find user by name
    const user = await User.findOne({ name: name });  // Find user by name, not by ID
    const vehicle = await Vehicle.findOne({ make: make });  // Find vehicle by make, not by ID

    if (!user) {
      return res.status(404).send('User not found');
    }
    if (!vehicle) {
      return res.status(404).send('Vehicle not found');
    }
    if (!vehicle.availability) {
      return res.status(400).send('Vehicle is not available for rental');
    }

    const start = moment(rentalStart);
    const end = moment(rentalEnd);

    const rentalDuration = end.diff(start, 'days');
    if (rentalDuration <= 0) {
      return res.status(400).send('Rental duration must be at least 1 day');
    }

    const totalPrice = rentalDuration * vehicle.pricePerDay;

    // Create rental history document
    const rentalHistory = new RentalHistory({
      vehicleId: vehicle._id,  // Use vehicle's _id
      userId: user._id,  // Use user's _id
      rentalStart: start,
      rentalEnd: end,
      rentalDuration,
      totalPrice,
      status: 'ongoing',
    });

    await rentalHistory.save();

    // Update vehicle availability
    vehicle.availability = false;
    await vehicle.save();

    res.status(201).json(rentalHistory);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Controller to get rental history for a user
exports.getRentalHistoryForUser = async (req, res) => {
  const { name } = req.params;

  try {
    // Find user by name
    const user = await User.findOne({ name: name });

    if (!user) {
      return res.status(404).send('User not found');
    }

    const rentalHistory = await RentalHistory.find({ userId: user._id })  // Use user._id here
      .populate('vehicleId', 'make model year pricePerDay')  // Populate vehicle information
      .populate('userId', 'name email phone')  // Populate user information
      .exec();

    if (!rentalHistory || rentalHistory.length === 0) {
      return res.status(404).send('No rental history found for this user');
    }

    res.json(rentalHistory);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Controller to get rental history for a vehicle
exports.getRentalHistoryForVehicle = async (req, res) => {
  const { make } = req.params;

  try {
    // Find vehicle by make
    const vehicle = await Vehicle.findOne({ make: make });

    if (!vehicle) {
      return res.status(404).send('Vehicle not found');
    }

    const rentalHistory = await RentalHistory.find({ vehicleId: vehicle._id })  // Use vehicle._id here
      .populate('vehicleId', 'make model year pricePerDay')  // Populate vehicle information
      .populate('userId', 'name email phone')  // Populate user information
      .exec();

    if (!rentalHistory || rentalHistory.length === 0) {
      return res.status(404).send('No rental history found for this vehicle');
    }

    res.json(rentalHistory);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Controller to mark a rental as completed
exports.completeRental = async (req, res) => {
  const { rentalId } = req.params;

  try {
    const rentalHistory = await RentalHistory.findById(rentalId);
    if (!rentalHistory) {
      return res.status(404).send('Rental not found');
    }

    if (rentalHistory.status === 'completed') {
      return res.status(400).send('Rental already completed');
    }

    rentalHistory.status = 'completed';
    await rentalHistory.save();

    // Mark vehicle as available
    const vehicle = await Vehicle.findById(rentalHistory.vehicleId);
    vehicle.availability = true;
    await vehicle.save();

    res.json(rentalHistory);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};
