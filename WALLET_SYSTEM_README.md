# Wallet System Implementation

## Overview

The wallet system allows users to fund their wallet and use the funds to purchase gift cards directly from the platform. This provides a seamless payment experience and reduces dependency on external payment processors for every transaction.

## Features

### 1. Wallet Management
- **View Balance**: Users can see their current wallet balance
- **Fund Wallet**: Multiple payment methods (Paystack, Manual Bank Transfer)
- **Transaction History**: Complete history of all wallet transactions
- **Balance Visibility Toggle**: Hide/show balance for privacy

### 2. Payment Methods
- **Wallet Payment**: Use wallet funds for instant purchases
- **Paystack**: External payment processor for funding
- **Manual Bank Transfer**: Transfer to admin account with proof upload

### 3. Transaction Types
- **Fund**: Adding money to wallet
- **Purchase**: Buying gift cards with wallet funds
- **Withdrawal**: Taking money out of wallet
- **Refund**: Returning funds to wallet

## Database Schema

### wallet_transactions Table
```sql
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT CHECK (type IN ('fund', 'purchase', 'withdrawal', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method TEXT,
    reference TEXT,
    description TEXT,
    proof_of_payment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Screens Added

### 1. Wallet Screen (`screens/Wallet.js`)
- Main wallet management interface
- Shows current balance with visibility toggle
- Quick actions for funding and withdrawing
- Recent transaction history
- Navigation to detailed transaction history

### 2. Fund Wallet Screen (`screens/FundWallet.js`)
- Amount input for funding
- Payment method selection (Paystack/Manual Transfer)
- Bank details display for manual transfers
- Proof of payment upload
- Real-time feedback and status updates

## Updated Screens

### 1. BuyGiftcardForm (`screens/BuyGiftcardForm.js`)
- Added wallet payment method
- Wallet balance display
- Insufficient balance warnings
- Wallet payment processing
- Updated payment method selector

### 2. Dashboard (`screens/Dashboard.js`)
- Added "My Wallet" button
- Enhanced balance display
- Quick access to wallet management

### 3. App.js
- Added Wallet and FundWallet screen routes

## Implementation Details

### Wallet Payment Flow
1. User selects "Wallet" payment method
2. System checks wallet balance
3. If sufficient funds:
   - Deduct amount from wallet
   - Create wallet transaction record
   - Create gift card transaction
   - Mark card as sold
4. If insufficient funds:
   - Show warning message
   - Prompt to fund wallet

### Funding Flow
1. User enters amount to fund
2. Selects payment method (Paystack/Manual Transfer)
3. For Paystack:
   - Simulate payment (integrate real Paystack API)
   - Create completed wallet transaction
   - Update user balance
4. For Manual Transfer:
   - Upload proof of payment
   - Create pending wallet transaction
   - Await admin approval

### Security Features
- Row Level Security (RLS) policies
- User can only view their own transactions
- Admins can view and manage all transactions
- Balance updates handled securely
- Transaction validation and error handling

## Admin Features

### Wallet Transaction Management
- View all wallet transactions
- Approve/reject pending funding requests
- Monitor wallet activity
- Handle refunds and adjustments

### Admin Dashboard Updates
- Wallet transaction statistics
- Funding request approvals
- User balance management

## Usage Instructions

### For Users

1. **Access Wallet**:
   - Go to Dashboard
   - Click "My Wallet" button
   - View balance and transaction history

2. **Fund Wallet**:
   - In Wallet screen, click "Fund Wallet"
   - Enter amount
   - Choose payment method
   - Complete payment process

3. **Buy with Wallet**:
   - Browse gift cards
   - Select a card to buy
   - Choose "Wallet" payment method
   - Confirm purchase

### For Admins

1. **Approve Funding Requests**:
   - Go to admin dashboard
   - Navigate to wallet transactions
   - Review pending funding requests
   - Approve or reject with reason

2. **Monitor Wallet Activity**:
   - View transaction statistics
   - Monitor user balances
   - Handle support requests

## Setup Instructions

### 1. Database Setup
Run the SQL script `wallet_setup.sql` in your Supabase SQL editor:

```sql
-- Execute the wallet_setup.sql file
-- This creates the wallet_transactions table and necessary policies
```

### 2. Storage Setup
Create a storage bucket for proof of payment images:
- Go to Supabase Dashboard
- Navigate to Storage
- Create bucket named "proofs"
- Set public access as needed

### 3. Admin Bank Details
Ensure admin bank details are set up in the `admin_bank_details` table for manual transfers.

## API Integration

### Paystack Integration
To integrate real Paystack payments:

1. Add Paystack SDK to your project
2. Replace the simulated payment in `FundWallet.js`
3. Handle webhook notifications for payment confirmation
4. Update transaction status based on payment result

### Webhook Handling
Set up webhook endpoints to handle:
- Payment confirmations
- Failed payments
- Refund notifications

## Error Handling

### Common Scenarios
1. **Insufficient Balance**: Show clear error message with funding options
2. **Payment Failure**: Retry mechanism and user feedback
3. **Network Issues**: Offline handling and retry logic
4. **Admin Rejection**: Clear reason display and next steps

### Validation
- Amount validation (positive numbers, minimum amounts)
- Balance checks before transactions
- Payment method validation
- File upload validation for proof images

## Testing

### Test Cases
1. **Wallet Funding**:
   - Test Paystack payment flow
   - Test manual transfer with proof upload
   - Test insufficient balance scenarios

2. **Wallet Purchases**:
   - Test successful wallet payment
   - Test insufficient balance purchase attempt
   - Test concurrent purchase attempts

3. **Admin Functions**:
   - Test funding request approval
   - Test funding request rejection
   - Test balance adjustments

## Future Enhancements

### Planned Features
1. **Wallet Limits**: Set maximum funding and withdrawal limits
2. **Auto-Funding**: Scheduled wallet top-ups
3. **Wallet Cards**: Virtual cards for external payments
4. **Referral Bonuses**: Wallet credits for referrals
5. **Loyalty Program**: Points system with wallet integration

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live balance updates
2. **Offline Support**: Local transaction caching
3. **Analytics**: Detailed wallet usage analytics
4. **Multi-currency**: Support for different currencies

## Troubleshooting

### Common Issues
1. **Balance Not Updating**: Check transaction status and triggers
2. **Payment Failures**: Verify payment method configuration
3. **Upload Errors**: Check storage bucket permissions
4. **Navigation Issues**: Ensure all routes are properly configured

### Debug Steps
1. Check browser console for errors
2. Verify Supabase connection
3. Test database queries directly
4. Check RLS policies
5. Verify storage bucket access

## Security Considerations

### Data Protection
- All sensitive data encrypted
- RLS policies enforced
- Input validation on all forms
- File upload restrictions

### Transaction Security
- Atomic transactions for balance updates
- Duplicate transaction prevention
- Rate limiting on funding requests
- Audit trail for all transactions

## Performance Optimization

### Database
- Indexed queries for fast lookups
- Efficient transaction processing
- Connection pooling
- Query optimization

### Frontend
- Lazy loading of transaction history
- Pagination for large datasets
- Caching of user balance
- Optimized image uploads

This wallet system provides a comprehensive solution for managing user funds within the gift card platform, offering both convenience and security for users while maintaining full administrative control. 