<?php
// Flutterwave Payment Callback Handler

// Get payment status from Flutterwave
$status = $_GET['status'] ?? '';
$tx_ref = $_GET['tx_ref'] ?? '';
$transaction_id = $_GET['transaction_id'] ?? '';

// Log the callback
error_log("Flutterwave callback received - Status: {$status}, Reference: {$tx_ref}, Transaction ID: {$transaction_id}");

// Create a simple HTML page to show payment status
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Status</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .status-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .success { color: #28a745; }
        .failed { color: #dc3545; }
        .pending { color: #ffc107; }
        h1 {
            margin: 0 0 1rem 0;
            color: #333;
        }
        p {
            color: #666;
            margin: 0.5rem 0;
        }
        .reference {
            background: #f8f9fa;
            padding: 0.5rem;
            border-radius: 5px;
            font-family: monospace;
            margin: 1rem 0;
        }
        .redirect-info {
            margin-top: 2rem;
            padding: 1rem;
            background: #e9ecef;
            border-radius: 5px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <?php if ($status === 'successful'): ?>
            <div class="status-icon success">✅</div>
            <h1>Payment Successful!</h1>
            <p>Your wallet has been funded successfully.</p>
        <?php elseif ($status === 'cancelled'): ?>
            <div class="status-icon failed">❌</div>
            <h1>Payment Cancelled</h1>
            <p>You cancelled the payment process.</p>
        <?php elseif ($status === 'failed'): ?>
            <div class="status-icon failed">❌</div>
            <h1>Payment Failed</h1>
            <p>There was an issue processing your payment.</p>
        <?php else: ?>
            <div class="status-icon pending">⏳</div>
            <h1>Payment Pending</h1>
            <p>Your payment is being processed.</p>
        <?php endif; ?>
        
        <?php if ($tx_ref): ?>
            <div class="reference">
                <strong>Reference:</strong> <?php echo htmlspecialchars($tx_ref); ?>
            </div>
        <?php endif; ?>
        
        <div class="redirect-info">
            <p>You will be redirected back to the app automatically.</p>
            <p>If you're not redirected, please close this window and return to the app.</p>
        </div>
    </div>

    <script>
        // Redirect to the app after 3 seconds
        setTimeout(function() {
            const redirectUrl = `giftcardapp://payment-callback?status=<?php echo urlencode($status); ?>&reference=<?php echo urlencode($tx_ref); ?>&transaction_id=<?php echo urlencode($transaction_id); ?>`;
            window.location.href = redirectUrl;
        }, 3000);
        
        // Also try to redirect immediately
        const redirectUrl = `giftcardapp://payment-callback?status=<?php echo urlencode($status); ?>&reference=<?php echo urlencode($tx_ref); ?>&transaction_id=<?php echo urlencode($transaction_id); ?>`;
        window.location.href = redirectUrl;
    </script>
</body>
</html> 