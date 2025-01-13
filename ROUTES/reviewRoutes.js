const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviews,
  markReviewHelpful,
  markReviewUnhelpful,
  moderateReview
} = require('../CONTROLLERS/reviewController');
const { isAuthenticated } = require('../MIDDLEWARE/authenticateuser');

// Route to create a new review
router.post('/reviews', isAuthenticated, createReview);

// Route to fetch reviews for a specific vehicle
router.get('/reviews/:vehicleId', getReviews);

// Routes to mark a review as helpful or unhelpful
router.post('/reviews/:reviewId/helpful', isAuthenticated, markReviewHelpful);
router.post('/reviews/:reviewId/unhelpful', isAuthenticated, markReviewUnhelpful);

// Admin route to moderate review (approve or reject)
router.put('/reviews/:reviewId/moderate', moderateReview);

module.exports = router;

