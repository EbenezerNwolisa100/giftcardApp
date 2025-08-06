const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Flutterwave Configuration
const FLUTTERWAVE_SECRET_KEY = "FLWSECK_TEST-969dac723950b37a2474e82bad8c5e06-X";
const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-5ffda8e1c4628295ae1144e4c4a88109-X";

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Flutterwave payment
app.post('/api/flutterwave/initialize', async (req, res) => {
  try {
    const { amount, email, reference, metadata } = req.body;
    
    const payload = {
      tx_ref: reference,
      amount: amount * 100, // Convert to kobo
      currency: 'NGN',
      redirect_url: `${req.protocol}://${req.get('host')}/api/flutterwave/callback`,
      customer: {
        email: email,
        name: metadata?.customer_name || 'Customer'
      },
      meta: metadata || {},
      customizations: {
        title: 'Gift Card App',
        description: 'Wallet Funding',
        logo: 'https://your-app.com/logo.png'
      }
    };

    const response = await axios.post('https://api.flutterwave.com/v3/payments', payload, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'success') {
      res.json({
        success: true,
        data: {
          payment_url: response.data.data.link,
          reference: reference,
          status: response.data.data.status
        }
      });
    } else {
      throw new Error('Failed to initialize payment');
    }
  } catch (error) {
    console.error('Flutterwave initialization error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify Flutterwave payment
app.post('/api/flutterwave/verify', async (req, res) => {
  try {
    const { reference } = req.body;
    
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`
      }
    });

    if (response.data.status === 'success') {
      const transaction = response.data.data;
      
      // Verify the payment details
      if (transaction.status === 'successful') {
        res.json({
          success: true,
          data: {
            reference: transaction.tx_ref,
            amount: transaction.amount / 100, // Convert from kobo
            currency: transaction.currency,
            status: transaction.status,
            customer_email: transaction.customer.email,
            payment_type: transaction.payment_type,
            created_at: transaction.created_at
          }
        });
      } else {
        res.json({
          success: false,
          error: 'Payment not successful',
          data: transaction
        });
      }
    } else {
      throw new Error('Failed to verify payment');
    }
  } catch (error) {
    console.error('Flutterwave verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Flutterwave webhook handler
app.post('/api/flutterwave/webhook', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    const payload = req.body;
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha512', FLUTTERWAVE_SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const { tx_ref, status, amount, currency } = payload.data;
    
    if (status === 'successful') {
      // Update your database here
      console.log(`Payment successful for reference: ${tx_ref}, amount: ${amount}`);
      
      // You would typically:
      // 1. Find the transaction in your database
      // 2. Update the status to 'completed'
      // 3. Credit the user's wallet
      // 4. Send notification to user
    }
    
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Payment callback (redirect from Flutterwave)
app.get('/api/flutterwave/callback', (req, res) => {
  const { status, tx_ref } = req.query;
  
  // Redirect to your app with payment status
  const redirectUrl = `giftcardapp://payment-callback?status=${status}&reference=${tx_ref}`;
  res.redirect(redirectUrl);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Flutterwave API server running on port ${PORT}`);
});

module.exports = app; 