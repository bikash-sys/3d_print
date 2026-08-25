const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5005;

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// Initialize Razorpay
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn('WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from environment variables.');
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret
});

// Route: Create Order
app.post('/api/create-order', async (req, res) => {
  const { amount, currency, receipt } = req.body;

  // Error handling: check auth keys
  if (!keyId || !keySecret) {
    return res.status(401).json({ error: 'Unauthorized: Razorpay API keys are not configured.' });
  }

  // Error handling: validate amount >= 100 paise
  if (!amount || typeof amount !== 'number' || amount < 100) {
    return res.status(400).json({ error: 'Bad Request: Amount must be at least 100 paise.' });
  }

  const options = {
    amount: Math.round(amount), // must be integer paise
    currency: currency || 'INR',
    receipt: receipt || `receipt_order_${Date.now()}`
  };

  try {
    const order = await razorpay.orders.create(options);
    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      error: 'Internal Server Error: Failed to create order.',
      details: error.message || error
    });
  }
});

// Route: Verify Signature
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  // Error handling: check auth keys
  if (!keyId || !keySecret) {
    return res.status(401).json({ error: 'Unauthorized: Razorpay API keys are not configured.' });
  }

  // Error handling: missing fields
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Bad Request: Missing required payment details.' });
  }

  // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body.toString())
    .digest('hex');

  // Compare generated signature with razorpay_signature
  if (expectedSignature === razorpay_signature) {
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.'
    });
  } else {
    console.warn(`Payment verification failed. Expected: ${expectedSignature}, Received: ${razorpay_signature}`);
    return res.status(400).json({
      success: false,
      error: 'Payment Verification Failed: Signature mismatch.'
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Razorpay backend server running on port ${PORT}`);
});
