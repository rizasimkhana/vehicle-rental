const Payment = require('../MODELS/payment');
const mongoose = require('mongoose')
const Razorpay = require('razorpay');
const PDFDocument = require('pdfkit');
const blobStream = require('blob-stream');
const User = require('../MODELS/user');  // Assuming you have a User model

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,  // Your Razorpay Key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET  // Your Razorpay Key Secret
});

const validPaymentMethods = ['UPI', 'Credit Card'];  // Only UPI and Credit Card are supported now

// Create Transaction and Process Payment (for Razorpay UPI)
exports.createTransaction = async (req, res) => {
  const { amount, paymentId, userId, paymentMethod, email } = req.body;

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

  // Validate that paymentId is provided
  if (!paymentId) {
    return res.status(400).send({ error: 'Razorpay payment ID is required.' });
  }

  // Validate payment method
  const validPaymentMethods = ['UPI', 'Credit Card'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).send({ error: 'Invalid payment method' });
  }

  try {
    // Create a new payment record in the database
    const payment = new Payment({
      userId: user._id,
      amount,
      paymentMethod,
      transactionId: paymentId,  // Save Razorpay payment ID as transaction ID
      status: 'Completed',  // Assuming the payment is completed successfully
      email,
    });

    await payment.save();

    res.status(200).send({ success: true, paymentId, amount, paymentMethod });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ error: error.message });
  }
};




exports.getPaymentHistory = async (req, res) => {
  const { userId } = req.params;  // userId is either the email (for traditional login) or googleId (for Google login)

  try {
    // First, try to find the user by googleId or email (userId is either email or googleId)
    const user = await User.findOne({
      $or: [
        { googleId: userId },  // Check for Google ID
        { userId: userId }      // Check for traditional userId (email)
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Assuming that 'userId' in the Payment model links to the user's _id
    const payments = await Payment.find({ userId: user._id });

    if (payments.length === 0) {
      return res.status(200).json([]);  // Return empty array if no payments found
    }

    return res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({ error: error.message });
  }
};








// Generate invoice - Dummy logic for now
exports.generateInvoice = async (req, res) => {
  const { paymentId } = req.params;

  try {
    // Find payment by paymentId
    const payment = await Payment.findOne({ transactionId: paymentId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Find the user associated with the payment
    const user = await User.findById(payment.userId); // Assuming the payment document has a userId field

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set up response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${paymentId}.pdf`);

    // Start adding content to the PDF
    doc.fontSize(30).fillColor('#4A90E2').text('Invoice', { align: 'center' }); // Title with color
    doc.moveDown(1); // Add space

    // Add user information
    doc.fontSize(18).fillColor('#333333').text(`Customer Name: ${user.name}`, { align: 'left' });
    doc.moveDown(0.5); // Add space
    doc.text(`Email: ${user.email}`, { align: 'left' });
    doc.moveDown(0.5);

    // Add payment details
    doc.fontSize(18).fillColor('#333333').text(`Payment Id: ${payment.transactionId}`, { align: 'left' });
    doc.moveDown(0.5); // Add space
    doc.fontSize(16).text(`Amount: ₹${payment.amount}`, { align: 'left' });
    doc.moveDown(0.5);
    doc.text(`Payment Date: ${new Date(payment.date).toLocaleDateString()}`, { align: 'left' });
    doc.moveDown(0.5);
    doc.text(`Payment Status: ${payment.status}`, { align: 'left' });
    
    // Adding a dividing line for style
    doc.moveDown(1);
    doc.strokeColor('#000000').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1); // Add space after the line
    
    // Add footer or company details
    doc.fontSize(12).fillColor('#666666').text('Dash Cars', { align: 'center' });
    doc.text('Address: XYZ Street, City', { align: 'center' });
    doc.text('Phone: (123) 456-7890', { align: 'center' });
    doc.text('Email: contact@company.com', { align: 'center' });
    doc.text('Thank You for visting us', { align: 'center' });


    // Finalize the document and pipe to response
    doc.end(); // Finalize the document
    doc.pipe(res); // Pipe the PDF to the response stream
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: error.message });
  }
};



