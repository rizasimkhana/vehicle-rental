const express = require('express');
const router = express.Router();
const paymentController = require('../CONTROLLERS/paymentController');


// Route to create a transaction (process payment)
router.post('/create-transaction', paymentController.createTransaction);

// Route to get the payment history of a user
router.get('/history/:userId',  paymentController.getPaymentHistory);

// Route to generate and download an invoice for a specific payment
router.get('/invoice/:paymentId',  paymentController.generateInvoice);



module.exports = router;
