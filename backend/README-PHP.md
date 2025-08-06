# PHP Backend for Flutterwave Integration

This PHP backend handles Flutterwave payment integration for the Gift Card App.

## Requirements

- PHP 7.4 or higher
- cURL extension enabled
- JSON extension enabled
- Web server (Apache/Nginx) or PHP built-in server

## Setup Instructions

### 1. File Structure
```
backend/
├── flutterwave-api.php    # Main API file
├── callback.php           # Payment callback handler
└── README-PHP.md         # This file
```

### 2. Configure Flutterwave Keys
Update the Flutterwave keys in `flutterwave-api.php`:
```php
$FLUTTERWAVE_SECRET_KEY = "YOUR_SECRET_KEY";
$FLUTTERWAVE_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
```

### 3. Running the PHP Backend

#### Option A: Using PHP Built-in Server (Development)
```bash
cd backend
php -S localhost:8000
```

#### Option B: Using Apache/Nginx (Production)
1. Upload files to your web server
2. Ensure the directory is accessible via web
3. Configure your web server to handle PHP files

### 4. Update React Native App
Update the API URLs in your React Native app to point to your PHP backend:

```javascript
// In FundWallet.js, change the fetch URLs:
const response = await fetch('http://localhost:8000/flutterwave-api.php/initialize', {
  // ... rest of the code
});
```

## API Endpoints

### 1. Health Check
**GET** `http://localhost:8000/flutterwave-api.php/health`

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00+00:00",
  "message": "Flutterwave API is running"
}
```

### 2. Initialize Payment
**POST** `http://localhost:8000/flutterwave-api.php/initialize`

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

### 3. Verify Payment
**POST** `http://localhost:8000/flutterwave-api.php/verify`

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

### 4. Webhook Handler
**POST** `http://localhost:8000/flutterwave-api.php/webhook`

This endpoint receives payment notifications from Flutterwave.

### 5. Payment Callback
**GET** `http://localhost:8000/callback.php`

This endpoint handles redirects from Flutterwave after payment completion.

## Testing

### 1. Test the API
```bash
# Test health check
curl http://localhost:8000/flutterwave-api.php/health

# Test payment initialization
curl -X POST http://localhost:8000/flutterwave-api.php/initialize \
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
For production, consider using environment variables:
```php
$FLUTTERWAVE_SECRET_KEY = $_ENV['FLUTTERWAVE_SECRET_KEY'] ?? 'your_secret_key';
$FLUTTERWAVE_PUBLIC_KEY = $_ENV['FLUTTERWAVE_PUBLIC_KEY'] ?? 'your_public_key';
```

### 2. Webhook URL
Configure your Flutterwave webhook URL to point to:
```
https://your-domain.com/flutterwave-api.php/webhook
```

### 3. SSL Certificate
Ensure your domain has a valid SSL certificate for secure webhook communication.

### 4. Error Logging
Enable error logging in your PHP configuration:
```php
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', '/path/to/error.log');
```

## Security Notes

1. **Never expose your secret key** in client-side code
2. **Always verify webhook signatures** before processing payments
3. **Use HTTPS** in production
4. **Validate all input data** before processing
5. **Implement rate limiting** to prevent abuse
6. **Set proper file permissions** (644 for .php files)

## Troubleshooting

### Common Issues

1. **CORS Errors**: The PHP file includes CORS headers, but you may need to configure your web server
2. **cURL Not Available**: Ensure cURL extension is installed and enabled
3. **JSON Errors**: Ensure JSON extension is enabled
4. **Permission Denied**: Check file permissions and web server configuration
5. **Webhook Not Received**: Check your webhook URL and SSL certificate

### Debug Mode
Enable debug logging by adding this to your PHP file:
```php
ini_set('display_errors', 1);
ini_set('log_errors', 1);
```

### Check PHP Extensions
```bash
php -m | grep -E "(curl|json)"
```

## Advantages of PHP Backend

1. **Easy to deploy** on most web hosting services
2. **No additional dependencies** required
3. **Built-in cURL support** for API calls
4. **Simple file-based deployment**
5. **Wide hosting support**

## Support

For issues with:
- **Flutterwave API**: Check [Flutterwave Documentation](https://developer.flutterwave.com/)
- **PHP Issues**: Check PHP error logs
- **Integration Issues**: Verify your API keys and webhook configuration 