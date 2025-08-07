<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Flutterwave Configuration
$FLUTTERWAVE_SECRET_KEY = "FLWSECK_TEST-969dac723950b37a2474e82bad8c5e06-X";
$FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-5ffda8e1c4628295ae1144e4c4a88109-X";

// Get the request path
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Route the request
$endpoint = end($path_parts);

switch ($endpoint) {
    case 'health':
        handleHealthCheck();
        break;
    case 'initialize':
        handleInitializePayment();
        break;
    case 'verify':
        handleVerifyPayment();
        break;
    case 'webhook':
        handleWebhook();
        break;
    case 'callback':
        handleCallback();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}

function handleHealthCheck() {
    echo json_encode([
        'status' => 'ok',
        'timestamp' => date('c'),
        'message' => 'Flutterwave API is running'
    ]);
}

function handleInitializePayment() {
    global $FLUTTERWAVE_SECRET_KEY;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    $amount = $input['amount'] ?? null;
    $email = $input['email'] ?? null;
    $reference = $input['reference'] ?? null;
    $metadata = $input['metadata'] ?? [];
    
    if (!$amount || !$email || !$reference) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: amount, email, reference']);
        return;
    }
    
    // Prepare Flutterwave payload
    $payload = [
        'tx_ref' => $reference,
        'amount' => $amount, // Send amount in naira (Flutterwave will handle display)
        'currency' => 'NGN',
        'redirect_url' => 'http://' . $_SERVER['HTTP_HOST'] . '/backend/callback.php',
        'customer' => [
            'email' => $email,
            'name' => $metadata['customer_name'] ?? 'Customer'
        ],
        'meta' => $metadata,
        'customizations' => [
            'title' => 'Gift Card App',
            'description' => 'Wallet Funding - ₦' . number_format($amount, 0)
        ]
    ];
    
    // Make request to Flutterwave
    $response = makeFlutterwaveRequest('https://api.flutterwave.com/v3/payments', $payload, $FLUTTERWAVE_SECRET_KEY);
    
    // Log the request for debugging
    error_log("Flutterwave request - Amount sent: " . $amount . " naira");
    
    if ($response['status'] === 'success') {
        // Log the response for debugging
        error_log("Flutterwave response: " . json_encode($response['data']));
        error_log("Flutterwave tx_ref: " . ($response['data']['tx_ref'] ?? 'NULL'));
        error_log("Our reference: " . $reference);
        
        $final_reference = $response['data']['tx_ref'] ?? $reference;
        error_log("Final reference being returned: " . $final_reference);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'payment_url' => $response['data']['link'],
                'reference' => $final_reference,
                'status' => $response['data']['status']
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to initialize payment: ' . ($response['message'] ?? 'Unknown error')
        ]);
    }
}

function handleVerifyPayment() {
    global $FLUTTERWAVE_SECRET_KEY;
    
    // Test log file creation
    logMessage("=== VERIFICATION REQUEST START ===");
    logMessage("Verification request received - Method: " . $_SERVER['REQUEST_METHOD']);
    logMessage("Verification request body: " . file_get_contents('php://input'));
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    logMessage("Parsed input: " . json_encode($input));
    
    if (!$input || !isset($input['reference'])) {
        logMessage("Verification failed - Missing reference");
        http_response_code(400);
        echo json_encode(['error' => 'Reference is required']);
        return;
    }
    
    $reference = $input['reference'];
    logMessage("Verifying reference: " . $reference);
    
    // Make request to Flutterwave verification endpoint
    $verification_url = "https://api.flutterwave.com/v3/transactions/{$reference}/verify";
    logMessage("Calling Flutterwave verification URL: " . $verification_url);
    
    $response = makeFlutterwaveRequest($verification_url, null, $FLUTTERWAVE_SECRET_KEY, 'GET');
    logMessage("Flutterwave verification response: " . json_encode($response));
    
    // If first attempt fails, try with the reference as transaction ID
    if ($response['status'] !== 'success' && is_numeric($reference)) {
        logMessage("First verification failed, trying with reference as transaction ID");
        $verification_url = "https://api.flutterwave.com/v3/transactions/{$reference}/verify";
        $response = makeFlutterwaveRequest($verification_url, null, $FLUTTERWAVE_SECRET_KEY, 'GET');
        logMessage("Second verification attempt response: " . json_encode($response));
    }
    
    if ($response['status'] === 'success') {
        $transaction = $response['data'];
        
        if ($transaction['status'] === 'successful') {
            logMessage("Payment verification successful");
            echo json_encode([
                'success' => true,
                'data' => [
                    'reference' => $transaction['tx_ref'],
                    'amount' => $transaction['amount'], // Amount is already in naira
                    'currency' => $transaction['currency'],
                    'status' => $transaction['status'],
                    'customer_email' => $transaction['customer']['email'],
                    'payment_type' => $transaction['payment_type'],
                    'created_at' => $transaction['created_at']
                ]
            ]);
        } else {
            logMessage("Payment not successful - status: " . $transaction['status']);
            echo json_encode([
                'success' => false,
                'error' => 'Payment not successful',
                'data' => $transaction
            ]);
        }
    } else {
        logMessage("Verification failed - response: " . json_encode($response));
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to verify payment: ' . ($response['message'] ?? 'Unknown error'),
            'debug' => $response
        ]);
    }
}

function handleWebhook() {
    global $FLUTTERWAVE_SECRET_KEY;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get the webhook signature
    $signature = $_SERVER['HTTP_VERIF_HASH'] ?? '';
    $payload = file_get_contents('php://input');
    
    // Verify webhook signature
    $expected_signature = hash_hmac('sha512', $payload, $FLUTTERWAVE_SECRET_KEY);
    
    if ($signature !== $expected_signature) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid signature']);
        return;
    }
    
    $data = json_decode($payload, true);
    
    if ($data && isset($data['data'])) {
        $tx_ref = $data['data']['tx_ref'];
        $status = $data['data']['status'];
        $amount = $data['data']['amount'];
        $currency = $data['data']['currency'];
        
        if ($status === 'successful') {
            // Log the successful payment
            error_log("Payment successful for reference: {$tx_ref}, amount: {$amount} {$currency}");
            
            // Here you would typically:
            // 1. Find the transaction in your database
            // 2. Update the status to 'completed'
            // 3. Credit the user's wallet
            // 4. Send notification to user
            
            echo json_encode(['status' => 'success']);
        } else {
            error_log("Payment failed for reference: {$tx_ref}, status: {$status}");
            echo json_encode(['status' => 'failed', 'reason' => $status]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid webhook payload']);
    }
}

function handleCallback() {
    $status = $_GET['status'] ?? '';
    $tx_ref = $_GET['tx_ref'] ?? '';
    $transaction_id = $_GET['transaction_id'] ?? '';
    
    logMessage("Callback received - Status: {$status}, TX_REF: {$tx_ref}, Transaction ID: {$transaction_id}");
    
    // Return a simple HTML page that the WebView can load
    $html = '<!DOCTYPE html>
<html>
<head>
    <title>Payment Complete</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px; 
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 400px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .pending { color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Payment Complete</h2>
        <p>Your payment has been processed.</p>
        <p><strong>Status:</strong> <span class="' . ($status === 'successful' ? 'success' : 'error') . '">' . ucfirst($status) . '</span></p>
        <p><strong>Reference:</strong> ' . htmlspecialchars($tx_ref) . '</p>';
    
    if ($transaction_id) {
        $html .= '<p><strong>Transaction ID:</strong> ' . htmlspecialchars($transaction_id) . '</p>';
    }
    
    $html .= '
        <p>You can close this window and return to the app.</p>
    </div>
</body>
</html>';
    
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}

function makeFlutterwaveRequest($url, $data = null, $secret_key, $method = 'POST') {
    logMessage("Making Flutterwave request - URL: {$url}, Method: {$method}");
    if ($data) {
        logMessage("Request data: " . json_encode($data));
    }
    
    $ch = curl_init();
    
    $headers = [
        'Authorization: Bearer ' . $secret_key,
        'Content-Type: application/json'
    ];
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if ($method === 'POST' && $data) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    logMessage("Flutterwave response - HTTP Code: {$http_code}, Response: {$response}");
    if ($error) {
        logMessage("cURL Error: {$error}");
    }
    
    curl_close($ch);
    
    if ($error) {
        return ['status' => 'error', 'message' => $error];
    }
    
    if ($http_code !== 200) {
        return ['status' => 'error', 'message' => "HTTP {$http_code}", 'response' => $response];
    }
    
    $decoded_response = json_decode($response, true);
    logMessage("Decoded response: " . json_encode($decoded_response));
    
    return $decoded_response;
}

// Log function for debugging
function logMessage($message) {
    error_log("[Flutterwave API] " . $message);
    
    // Also write to a custom log file for easy access
    $log_file = __DIR__ . '/flutterwave_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[{$timestamp}] {$message}\n";
    
    // Try to write to log file
    $result = file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);
    if ($result === false) {
        error_log("Failed to write to log file: " . $log_file);
    }
}

// Test log file creation on script load
logMessage("PHP script loaded - testing log file creation");
?> 