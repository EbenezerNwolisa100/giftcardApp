# Gift Card App Backend - Flutterwave Integration

This backend API handles Flutterwave payment integration for the Gift Card App.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Flutterwave Keys
Update the Flutterwave keys in `flutterwave-api.js`:
```javascript
const FLUTTERWAVE_SECRET_KEY = "YOUR_SECRET_KEY";
const FLUTTERWAVE_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
```

### 3. Start the Server
```bash
npm start
# or for development with auto-restart:
npm run dev
```

The server will run on `http://localhost:3000`

## API Endpoints

### 1. Initialize Payment
**POST** `/api/flutterwave/initialize`

Request body:
```json
{
  "amount": 3000,
  "email": "user@example.com",
  "reference": "fw_ref_123456789",
  "metadata": {
    "amount": "2000",
    "processing_fee": "1000",
    "total_amount": "3000"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "payment_url": "https://checkout.flutterwave.com/v3/hosted/pay/...",
    "reference": "fw_ref_123456789",
    "status": "pending"
  }
}
```

### 2. Verify Payment
**POST** `/api/flutterwave/verify`

Request body:
```json
{
  "reference": "fw_ref_123456789"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "reference": "fw_ref_123456789",
    "amount": 3000,
    "currency": "NGN",
    "status": "successful",
    "customer_email": "user@example.com",
    "payment_type": "card",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Webhook Handler
**POST** `/api/flutterwave/webhook`

This endpoint receives payment notifications from Flutterwave.

### 4. Payment Callback
**GET** `/api/flutterwave/callback`

This endpoint handles redirects from Flutterwave after payment completion.

## Testing

### 1. Test the API
```bash
# Test health check
curl http://localhost:3000/api/health

# Test payment initialization
curl -X POST http://localhost:3000/api/flutterwave/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 3000,
    "email": "test@example.com",
    "reference": "test_ref_123",
    "metadata": {
      "amount": "2000",
      "processing_fee": "1000"
    }
  }'
```

### 2. Flutterwave Test Cards
Use these test card details:
- **Card Number**: 5531886652142950
- **CVV**: 564
- **Expiry**: 09/32
- **Pin**: 3310
- **OTP**: 12345

## Production Deployment

### 1. Environment Variables
Set these environment variables:
```bash
PORT=3000
FLUTTERWAVE_SECRET_KEY=your_live_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_live_public_key
```

### 2. Webhook URL
Configure your Flutterwave webhook URL to point to:
```
https://your-domain.com/api/flutterwave/webhook
```

### 3. SSL Certificate
Ensure your domain has a valid SSL certificate for secure webhook communication.

## Security Notes

1. **Never expose your secret key** in client-side code
2. **Always verify webhook signatures** before processing payments
3. **Use HTTPS** in production
4. **Validate all input data** before processing
5. **Implement rate limiting** to prevent abuse

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the CORS middleware is properly configured
2. **Webhook Not Received**: Check your webhook URL and SSL certificate
3. **Payment Verification Fails**: Ensure the reference matches exactly
4. **Server Won't Start**: Check if port 3000 is already in use

### Debug Mode
Enable debug logging by setting:
```javascript
console.log('Debug mode enabled');
```

## Support

For issues with:
- **Flutterwave API**: Check [Flutterwave Documentation](https://developer.flutterwave.com/)
- **Backend Issues**: Check the server logs for error messages
- **Integration Issues**: Verify your API keys and webhook configuration 