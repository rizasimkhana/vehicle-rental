// utils/notification.js
const nodemailer = require('nodemailer');
const moment = require('moment');


// Load environment variables
require('dotenv').config();

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,       // Use email from .env
    pass: process.env.EMAIL_PASS        // Use email password from .env
  }
});



// Function to send booking confirmation email
async function sendBookingConfirmationEmail(userEmail, bookingDetails) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Booking Confirmation',
    text: `Your booking has been confirmed!

      Vehicle: ${bookingDetails.vehicleId.make} ${bookingDetails.vehicleId.model}
      Start Date: ${moment(bookingDetails.startDate).format('YYYY-MM-DD')}
      End Date: ${moment(bookingDetails.endDate).format('YYYY-MM-DD')}
      Total Price: $${bookingDetails.vehicleId.pricePerDay * bookingDetails.bookingDays}

      Thank you for choosing us!`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

// Function to send booking reminder email
async function sendBookingReminderEmail(userEmail, bookingDetails) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Booking Reminder',
    text: `This is a reminder for your upcoming booking:
      
      Vehicle: ${bookingDetails.vehicleId.make} ${bookingDetails.vehicleId.model}
      Start Date: ${moment(bookingDetails.startDate).format('YYYY-MM-DD')}
      End Date: ${moment(bookingDetails.endDate).format('YYYY-MM-DD')}
      
      Please make sure to arrive on time.`
  };

}

  // Function to send booking reminder email
  async function sendBookingcancelledEmail(userEmail, bookingDetails) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Booking cancelled',
      text: `your booking cancelled for:
        
        Vehicle: ${bookingDetails.vehicleId.make} ${bookingDetails.vehicleId.model}
        Start Date: ${moment(bookingDetails.startDate).format('YYYY-MM-DD')}
        End Date: ${moment(bookingDetails.endDate).format('YYYY-MM-DD')}
        `
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log('cancelled email sent successfully');
    } catch (error) {
      console.error('Error sending reminder email:', error);
    }
  }
  

module.exports = {
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendBookingcancelledEmail
};
