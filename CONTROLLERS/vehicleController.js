// controllers/vehicleController.js

const Vehicle = require('../MODELS/vehicleModel');
const path = require('path');
// Create a new vehicle listing
exports.createVehicle = async (req, res) => {
  const { make, model, year, pricePerDay, availability, location, description } = req.body;
  if (!make || !model || !year || !pricePerDay || !location || !description) {
    return res.status(400).json({
      error: 'Missing required fields',
      fields: { make, model, year, pricePerDay, availability, location, description },
    });
  }

  const image = req.file ? req.file.path : null;

  try {
    const newVehicle = new Vehicle({
      make,
      model,
      year,
      pricePerDay,
      availability,
      location,
      description,
      image,
    });

    await newVehicle.save();
    res.status(201).json({ message: 'Vehicle added successfully!', vehicle: newVehicle });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add vehicle', message: err.message });
  }
};


exports.getVehicles = async (req, res) => {
  const { vehicleType, location, minPrice, maxPrice } = req.query;

  const filters = {};

  if (vehicleType) filters.model = vehicleType;
  if (location) filters.location = location;
  if (minPrice) filters.pricePerDay = { $gte: minPrice };
  if (maxPrice) filters.pricePerDay = { $lte: maxPrice };

  try {
    const vehicles = await Vehicle.find(filters);
    res.status(200).json({ vehicles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicles', message: err.message });
  }
};


// Get a single vehicle by ID
exports.getVehicleById = async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.status(200).json({ vehicle });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicle', message: err.message });
  }
};


// Update vehicle (either full or partial update)
exports.updateVehicle = async (req, res) => {
  const { id } = req.params;
  const { make, model, year, pricePerDay, availability, location, description } = req.body;

  const updateData = {};

  // Only update fields that are present in the request
  if (make) updateData.make = make;
  if (model) updateData.model = model;
  if (year) updateData.year = year;
  if (pricePerDay) updateData.pricePerDay = pricePerDay;
  if (availability) updateData.availability = availability;
  if (location) updateData.location = location;
  if (description) updateData.description = description;

  // If a new image is uploaded, add it to the updateData
  if (req.file) {
    // Ensure you're saving the correct file path or filename
    updateData.image = req.file.path;  // If you're saving the full path
    // updateData.image = req.file.filename;  // If you're saving only the filename
  }

  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.status(200).json({ message: 'Vehicle updated successfully', vehicle: updatedVehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update vehicle', error: error.message });
  }
};









  //delete a vehicle by id 

  exports.deleteVehicle = async (req, res) => {
    const { id } = req.params; // Vehicle ID passed in the route
  
    try {
      // Find and delete the vehicle by ID
      const deletedVehicle = await Vehicle.findByIdAndDelete(id);
  
      if (!deletedVehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
  
      res.status(200).json({
        message: 'Vehicle deleted successfully',
        vehicle: deletedVehicle
      });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting vehicle', message: err.message });
    }
  };