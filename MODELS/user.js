const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // Import bcryptjs for password hashing and comparison

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  password: { type: String },  // Store hashed password, can be null for social logins
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  googleId: { type: String, unique: true, required: false },
  userId: { type: String, unique: true, required: true },  // User's traditional login ID (if applicable)
}, { timestamps: true });

// Pre-save hook to hash the password before saving to DB
userSchema.pre('save', async function (next) {
    if (this.password && this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function (enteredPassword) {
    // If the password is not set, return false (no comparison needed for social logins)
    if (!this.password) {
        return false;  // Return false to indicate no password comparison is required
    }

    // Compare the entered password with the stored hash
    return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model
const User = mongoose.model('User', userSchema);
module.exports = User;
