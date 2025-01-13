const Review = require('../MODELS/Review');
const Vehicle = require('../MODELS/vehicleModel');

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { vehicleId, rating, reviewText } = req.body;

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Create a new review
    const review = new Review({
      vehicle: vehicleId,
      user: req.user._id,  // Assuming user is authenticated
      rating,
      reviewText,
    });

    await review.save();
    return res.status(201).json(review);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Get reviews for a vehicle
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ vehicle: req.params.vehicleId }).populate('user', 'name email');
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Mark a review as helpful
exports.markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.helpfulCount += 1;
    await review.save();
    return res.json(review);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Mark a review as unhelpful
exports.markReviewUnhelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.unhelpfulCount += 1;
    await review.save();
    return res.json(review);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Admin route to moderate a review (approve or reject)
exports.moderateReview = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.status = status;
    await review.save();
    return res.json(review);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};
