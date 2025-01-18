const User = require('../MODELS/user');  // Import the User model
const bcrypt = require('bcryptjs');  // Import bcryptjs for password hashing and comparison
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');  // For generating verification tokens
const { OAuth2Client } = require('google-auth-library');

// Utility function to send verification email
const sendVerificationEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const verificationUrl = `https://vehicle-rental-6o3p.onrender.com/users/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Please verify your email',
        text: `Click on the link to verify your email: ${verificationUrl}`,
    };

    await transporter.sendMail(mailOptions);
};

// Register a new user
const registerUser = async (req, res) => {
    const { name, email, phone, password, social } = req.body;  // social will determine if it's a social login

    try {
        // Check if user already exists (only for email-based registrations)
        let existingUser;
        if (!social) {
            existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        let newUser;
        if (social) {
            // Social sign-up (Google), no password required
            newUser = new User({
                name,
                email,
                phone,
                verified: false,
                verificationToken,
                googleId: social.googleId,
                userId: social.googleId,  // If social login, userId is the googleId
            });
        } else {
            // Normal email/password-based registration
            newUser = new User({
                name,
                email,
                phone,
                password,  // Store plain password, bcrypt will hash it before saving
                verified: false,
                verificationToken,
                userId: email,  // Use email as userId for traditional login
            });
        }

        await newUser.save();

        // Send verification email
        await sendVerificationEmail(newUser.email, verificationToken);

        return res.status(201).json({ message: 'User registered successfully. Please check your email for verification.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};

// Verify email
const verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.verified = true;
        user.verificationToken = null;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Initialize Google OAuth client with your client ID
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Login a user
const loginUser = async (req, res) => {
    const { email, password, token } = req.body; // Destructure from request body

    try {
        // If token is provided (Google OAuth Login)
        if (token) {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID, // Your Google Client ID
            });

            const payload = ticket.getPayload();
            const userEmail = payload.email;

            // Check if user exists in the database
            let user = await User.findOne({ email: userEmail });

            if (!user) {
                // If the user doesn't exist, create a new user (optional)
                user = new User({
                    email: userEmail,
                    name: payload.name,
                    verified: true, // Google users are verified by default
                    role: 'user',  // Default role can be 'user', you can customize this
                    picture: payload.picture,
                    googleId: payload.sub,  // Store Google unique ID
                    userId: payload.sub,    // Explicitly set the userId if it's required
                });

                // Save the new user to the database
                await user.save();
            }

            // Generate JWT token for the user
            const jwtToken = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Respond with the generated JWT token and user information
            return res.status(200).json({
                message: 'Login successful via Google',
                token: jwtToken,
                user,
            });
        }

        // If no token is provided, check for traditional email/password login
        if (email && password) {
            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Check if the user is verified
            if (!user.verified) {
                return res.status(400).json({ message: 'Please verify your email before logging in' });
            }

            // Compare the password with the hashed password in the database
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid password' });
            }

            // Generate JWT token for email/password login
            const jwtToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Respond with the generated JWT token
            return res.status(200).json({
                message: 'Login successful',
                token: jwtToken,
                user: {  // Include user details in the response
                    userId: user._id,  // Return the userId (instead of googleId)
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    verified: user.verified,
                }
            });
        }

        // If neither token nor email/password is provided
        return res.status(400).json({ message: 'Please provide login credentials or a Google token' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};



// Social Login (Google/Facebook)
const socialLogin = async (req, res) => {
    const { token } = req.body;  // The Google ID token from the frontend
  
    try {
      // Verify the token using the Google OAuth2 Client
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,  // Ensure this matches your Google Client ID
      });
  
      // Get the payload (user info) from the verified token
      const payload = ticket.getPayload();
      const email = payload.email;
      const googleId = payload.sub;  // Google unique ID
  
      console.log('Google user info:', payload);
  
      // Check if the user already exists in your database
      let user = await User.findOne({ googleId });
      if (!user) {
        // If the user doesn't exist, create a new user
        user = new User({
          email,
          googleId,           // Store Google ID as unique ID
          userId: googleId,   // Ensure userId is also set to googleId
          name: payload.name,
          verified: true,      // Assuming the Google account is verified
        });
  
        await user.save();
      }
  
      // Generate a JWT token for the signed-in user
      const jwtToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }  // Customize expiration time as needed
      );
  
      // Send the JWT token in the response
      return res.status(200).json({ message: 'Sign-in successful', token: jwtToken });
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return res.status(500).json({ message: 'Error during Google login', error });
    }
  };
  

module.exports = { registerUser, verifyEmail, loginUser, socialLogin };
