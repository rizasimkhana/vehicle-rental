// controllers/bookingController.js
const moment = require('moment');
const Booking = require('../MODELS/booking');
const Vehicle = require('../MODELS/vehicleModel');
const User = require('../MODELS/user');
const { sendBookingConfirmationEmail, sendBookingcancelledEmail } = require('../UTILS/notificationService'); 
const mongoose = require('mongoose');  // Import mongoose

// Check vehicle availability for the given dates
async function checkAvailability(vehicleId, startDate, endDate) {
  const bookings = await Booking.find({
    vehicleId,
    $or: [
      { startDate: { $lt: endDate }, endDate: { $gt: startDate } },
      { startDate: { $gte: startDate, $lt: endDate } },
      { endDate: { $gte: startDate, $lt: endDate } }
    ]
  });
  return bookings.length === 0; // If no bookings overlap, it's available
}

async function createBooking(req, res) {
  const { userId, vehicleId, startDate, endDate } = req.body;
  const start = moment(startDate).toDate();
  const end = moment(endDate).toDate();

  try {
    let user;

    console.log('Received userId:', userId);  // Log the userId for debugging

    // Handle Google ID (typically 21-22 characters) or MongoDB ObjectId (24 characters)
    if (typeof userId === 'string') {
      // Check if it is a numeric Google ID (or similar) with 21-22 digits
      if (/^\d{21,22}$/.test(userId)) {  // Regex for a numeric string of 21 or 22 digits
        console.log('Likely Google userId detected:', userId);
        user = await User.findOne({ googleId: userId });
      } else if (mongoose.Types.ObjectId.isValid(userId)) {  // Valid MongoDB ObjectId (24 characters)
        console.log('MongoDB userId detected:', userId);
        user = await User.findById(userId);
      } else {
        console.log('Invalid userId format:', userId);
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
    } else {
      console.log('userId is not a string:', userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the vehicle is available during the selected dates
    const isAvailable = await checkAvailability(vehicleId, start, end);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Vehicle is not available for the selected dates.' });
    }

    // Create a new booking
    const newBooking = new Booking({
      userId: user._id,  // Always use MongoDB user _id for the booking
      vehicleId,
      startDate: start,
      endDate: end,
      status: 'confirmed'
    });

    // Save the new booking and update vehicle availability
    await newBooking.save();
    await Vehicle.findByIdAndUpdate(vehicleId, { availability: false });

    // Get vehicle details
    const vehicle = await Vehicle.findById(vehicleId);

    // Send confirmation email
    await sendBookingConfirmationEmail(user.email, {
      vehicleId: vehicle,
      startDate: start,
      endDate: end,
      bookingDays: moment(endDate).diff(moment(startDate), 'days')
    });

    // Return success response
    res.status(201).json({
      message: 'Booking confirmed successfully!',
      booking: newBooking
    });
  } catch (error) {
    console.error('Error in booking creation:', error);
    res.status(500).json({ message: error.message });
  }
}





// Modify an existing booking
async function modifyBooking(req, res) {
  const { id } = req.params;
  const { startDate, endDate } = req.body;

  const updatedStart = moment(startDate).toDate();
  const updatedEnd = moment(endDate).toDate();

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the new dates are available for the selected vehicle
    const isAvailable = await checkAvailability(booking.vehicleId, updatedStart, updatedEnd);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Vehicle is not available for the new dates.' });
    }

    // Update the booking
    booking.startDate = updatedStart;
    booking.endDate = updatedEnd;
    await booking.save();

    // Log to verify the userId and check if it's valid
    console.log(`Booking userId: ${booking.userId}`);

    // Get user info by userId
    const user = await User.findById(booking.userId);

    // Check if user exists
    if (!user) {
      console.error(`User not found for userId: ${booking.userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure that the user has an email
    if (!user.email) {
      console.error(`User found but email is missing for userId: ${booking.userId}`);
      return res.status(400).json({ message: 'User email is not provided' });
    }

    const vehicle = await Vehicle.findById(booking.vehicleId);

    // Send updated booking confirmation (email and SMS)
    try {
      await sendBookingConfirmationEmail(user.email, {
        vehicleId: vehicle,
        startDate: updatedStart,
        endDate: updatedEnd,
        bookingDays: moment(updatedEnd).diff(moment(updatedStart), 'days')
      });
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Failed to send confirmation email' });
    }

    // Respond with updated booking details
    res.status(200).json({
      message: 'Booking modified successfully!',
      booking
    });
  } catch (error) {
    console.error('Error processing booking:', error);
    res.status(500).json({ message: error.message });
  }
}

async function cancelBooking(req, res) {
  const { id } = req.params;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Mark the booking as canceled
    booking.isCanceled = true;
    await booking.save();

    // Log to verify the userId and check if it's valid
    console.log(`Booking userId: ${booking.userId}`);

    // Get user info by userId
    const user = await User.findById(booking.userId);

    // Check if user exists
    if (!user) {
      console.error(`User not found for userId: ${booking.userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure that the user has an email
    if (!user.email) {
      console.error(`User found but email is missing for userId: ${booking.userId}`);
      return res.status(400).json({ message: 'User email is not provided' });
    }

    // Send cancellation email
    try {
      await sendBookingcancelledEmail(user.email, booking);
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      return res.status(500).json({ message: 'Failed to send cancellation email' });
    }

    // Respond with cancellation success
    res.status(200).json({
      message: 'Booking canceled successfully!',
      booking
    });
  } catch (error) {
    console.error('Error processing booking cancellation:', error);
    res.status(500).json({ message: error.message });
  }
}











async function getBookingsByUser(req, res) {
  let { userId } = req.params;
  userId = userId.trim();

  console.log('Received userId:', userId); // Log to check the userId format

  try {
    // Query the bookings and populate the related user and vehicle
    const bookings = await Booking.find({ userId: userId })
      .populate('userId', 'name')  // Populate the userId field with the name field from the User collection
      .populate('vehicleId', 'make model');  // Populate the vehicleId field with make and model from the Vehicle collection

    console.log('Bookings found for the user:', bookings); // Debug log to see the result

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this user' });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: error.message });
  }
}


// Get all bookings
async function getAllBookings(req, res) {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')  // Populate user details if needed
      .populate('vehicleId', 'make model');  // Populate vehicle details if needed

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found' });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: error.message });
  }
}






module.exports = {
  createBooking,
  modifyBooking,
  cancelBooking,
  getBookingsByUser,
  getAllBookings
};
