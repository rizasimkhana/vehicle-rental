const express = require('express');
const router = express.Router();
const passport = require('passport'); // Import passport
const { registerUser, verifyEmail, loginUser, socialLogin,getAllUsers } = require('../CONTROLLERS/userController');

// Register new user
router.post('/register', registerUser);

// Verify email
router.get('/verify-email', verifyEmail);

// User login
router.post('/login', loginUser);

// Social login (Google/Facebook)
router.post('/social-login', socialLogin);

app.get('/users', getAllUsers);

// Redirect to Google for authentication (OAuth)
router.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'], // Request profile and email scope
    })
);

// Callback route after Google authentication
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }), // Redirect on failure
    (req, res) => {
        // Successful login, redirect user to the dashboard or homepage
        res.redirect('/dashboard');
    }
);
module.exports = router;

