

// Load environment variables from the .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const vehicleRoutes = require('./ROUTES/vehicleRoutes');
const bookingRoutes = require('./ROUTES/bookingRoutes');
const userRoutes = require('./ROUTES/userRoutes');
const rentalRoutes = require('./ROUTES/rentalRoutes');
const paymentRoutes = require('./ROUTES/paymentRoutes');
const reviewRoutes = require('./ROUTES/reviewRoutes');
const path = require('path');
const cors = require('cors');
const passport = require('passport');

const app = express();

// Middleware
app.use(cors({
  origin: 'https://fanciful-custard-ad237e.netlify.app', // Allow requests from your frontend
  credentials: true,  // If you're using cookies or sessions
}));
app.use(bodyParser.json());
app.use(cors({
  origin: 'https://fanciful-custard-ad237e.netlify.app',  // Replace with the actual origin of your frontend
  methods: 'GET,POST',              // Allow necessary methods
  allowedHeaders: 'Content-Type,Authorization', // Add headers as needed
}));
app.use('/uploads', express.static(path.join(__dirname, process.env.IMAGE_UPLOAD_PATH))); // Serve uploaded images

app.use(express.urlencoded({ extended: true }));

// Passport setup
require('./passportSetup'); // Passport configuration (Google, Facebook)

// Connect to MongoDB using the DB_URI from .env
mongoose.connect(process.env.MONGO_URI,)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Use routes
app.use('/api', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/users', userRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', reviewRoutes);

// Server
const PORT = process.env.PORT || 5000;  // Use the port from .env, default to 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
