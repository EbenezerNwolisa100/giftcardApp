import { supabase } from './supabaseClient'

/**
 * Notification utility functions for creating standardized notifications across the platform
 */

// Notification action types
export const NOTIFICATION_ACTIONS = {
  // Transaction related
  TRANSACTION_APPROVED: 'transaction_approved',
  TRANSACTION_COMPLETED: 'transaction_completed', 
  TRANSACTION_REJECTED: 'transaction_rejected',
  
  // Withdrawal related
  WITHDRAWAL_APPROVED: 'withdrawal_approved',
  WITHDRAWAL_COMPLETED: 'withdrawal_completed',
  WITHDRAWAL_REJECTED: 'withdrawal_rejected',
  
  // Wallet related
  WALLET_FUNDED: 'wallet_funded',
  WALLET_TRANSACTION: 'wallet_transaction',
  
  // Support related
  SUPPORT_REPLY: 'support_reply',
  SUPPORT_REQUEST: 'support_request',
  
  // Security related
  SECURITY_ALERT: 'security_alert',
  PASSWORD_CHANGED: 'password_changed',
  PIN_CHANGED: 'pin_changed',
  
  // System related
  SYSTEM_UPDATE: 'system_update',
  MAINTENANCE: 'maintenance',
  
  // Promotional
  PROMOTION: 'promotion',
  RATE_UPDATE: 'rate_update',
  NEW_FEATURE: 'new_feature'
}

// Notification types for categorization
export const NOTIFICATION_TYPES = {
  TRANSACTION: 'transaction',
  WITHDRAWAL: 'withdrawal', 
  WALLET: 'wallet',
  SUPPORT: 'support',
  SECURITY: 'security',
  SYSTEM: 'system',
  PROMOTION: 'promotion'
}

/**
 * Create a notification in the database
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - User ID to send notification to
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body/message
 * @param {string} params.type - Notification type (from NOTIFICATION_TYPES)
 * @param {string} params.actionType - Action type (from NOTIFICATION_ACTIONS)
 * @param {Object} params.actionData - Additional data for the action
 * @param {string} params.relatedTransactionId - Related transaction ID (optional)
 * @param {string} params.relatedWithdrawalId - Related withdrawal ID (optional)
 * @param {string} params.relatedSupportRequestId - Related support request ID (optional)
 * @param {boolean} params.read - Whether notification is read (default: false)
 * @returns {Promise<Object>} Created notification object
 */
export const createNotification = async ({
  userId,
  title,
  body,
  type,
  actionType,
  actionData = {},
  relatedTransactionId = null,
  relatedWithdrawalId = null,
  relatedSupportRequestId = null,
  read = false
}) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        body,
        type,
        action_type: actionType,
        action_data: actionData,
        related_transaction_id: relatedTransactionId,
        related_withdrawal_id: relatedWithdrawalId,
        related_support_request_id: relatedSupportRequestId,
        read
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Create a transaction notification
 * @param {Object} params - Transaction notification parameters
 * @param {string} params.userId - User ID
 * @param {string} params.actionType - Action type (approved, completed, rejected)
 * @param {Object} params.transaction - Transaction object
 * @param {string} params.reason - Rejection reason (optional)
 */
export const createTransactionNotification = async ({
  userId,
  actionType,
  transaction,
  reason = null
}) => {
  const amount = transaction.total || transaction.amount
  const formattedAmount = Number(amount).toLocaleString()
  
  let title, body, notificationActionType
  
  switch (actionType) {
    case 'approved':
    case 'completed':
      title = 'Transaction Approved'
      body = `Your gift card transaction of ₦${formattedAmount} has been approved.`
      notificationActionType = NOTIFICATION_ACTIONS.TRANSACTION_APPROVED
      break
    case 'rejected':
      title = 'Transaction Rejected'
      body = `Your gift card transaction of ₦${formattedAmount} was rejected.${reason ? ` Reason: ${reason}` : ''}`
      notificationActionType = NOTIFICATION_ACTIONS.TRANSACTION_REJECTED
      break
    default:
      throw new Error(`Invalid transaction action type: ${actionType}`)
  }

  return createNotification({
    userId,
    title,
    body,
    type: NOTIFICATION_TYPES.TRANSACTION,
    actionType: notificationActionType,
    actionData: {
      transactionId: transaction.id,
      amount: formattedAmount,
      status: actionType
    },
    relatedTransactionId: transaction.id
  })
}

/**
 * Create a withdrawal notification
 * @param {Object} params - Withdrawal notification parameters
 * @param {string} params.userId - User ID
 * @param {string} params.actionType - Action type (approved, completed, rejected)
 * @param {Object} params.withdrawal - Withdrawal object
 * @param {string} params.reason - Rejection reason (optional)
 */
export const createWithdrawalNotification = async ({
  userId,
  actionType,
  withdrawal,
  reason = null
}) => {
  const formattedAmount = Number(withdrawal.amount).toLocaleString()
  
  let title, body, notificationActionType
  
  switch (actionType) {
    case 'approved':
    case 'completed':
      title = 'Withdrawal Approved'
      body = `Your withdrawal of ₦${formattedAmount} has been approved.`
      notificationActionType = NOTIFICATION_ACTIONS.WITHDRAWAL_APPROVED
      break
    case 'rejected':
      title = 'Withdrawal Rejected'
      body = `Your withdrawal of ₦${formattedAmount} was rejected.${reason ? ` Reason: ${reason}` : ''}`
      notificationActionType = NOTIFICATION_ACTIONS.WITHDRAWAL_REJECTED
      break
    default:
      throw new Error(`Invalid withdrawal action type: ${actionType}`)
  }

  return createNotification({
    userId,
    title,
    body,
    type: NOTIFICATION_TYPES.WITHDRAWAL,
    actionType: notificationActionType,
    actionData: {
      withdrawalId: withdrawal.id,
      amount: formattedAmount,
      status: actionType
    },
    relatedWithdrawalId: withdrawal.id
  })
}

/**
 * Create a wallet funding notification
 * @param {Object} params - Wallet funding notification parameters
 * @param {string} params.userId - User ID
 * @param {Object} params.transaction - Wallet transaction object
 */
export const createWalletFundingNotification = async ({
  userId,
  transaction
}) => {
  const formattedAmount = Number(transaction.amount).toLocaleString()
  
  return createNotification({
    userId,
    title: 'Wallet Funded',
    body: `Your wallet has been funded with ₦${formattedAmount}.`,
    type: NOTIFICATION_TYPES.WALLET,
    actionType: NOTIFICATION_ACTIONS.WALLET_FUNDED,
    actionData: {
      transactionId: transaction.id,
      amount: formattedAmount,
      paymentMethod: transaction.payment_method
    },
    relatedTransactionId: transaction.id
  })
}

/**
 * Create a support reply notification
 * @param {Object} params - Support reply notification parameters
 * @param {string} params.userId - User ID
 * @param {string} params.reply - Admin reply message
 * @param {string} params.supportRequestId - Support request ID
 */
export const createSupportReplyNotification = async ({
  userId,
  reply,
  supportRequestId
}) => {
  return createNotification({
    userId,
    title: 'Support Reply',
    body: reply,
    type: NOTIFICATION_TYPES.SUPPORT,
    actionType: NOTIFICATION_ACTIONS.SUPPORT_REPLY,
    actionData: {
      supportRequestId,
      reply
    },
    relatedSupportRequestId: supportRequestId
  })
}

/**
 * Create a security alert notification
 * @param {Object} params - Security alert notification parameters
 * @param {string} params.userId - User ID
 * @param {string} params.title - Alert title
 * @param {string} params.body - Alert message
 * @param {string} params.alertType - Type of security alert
 */
export const createSecurityAlertNotification = async ({
  userId,
  title,
  body,
  alertType = 'general'
}) => {
  return createNotification({
    userId,
    title,
    body,
    type: NOTIFICATION_TYPES.SECURITY,
    actionType: NOTIFICATION_ACTIONS.SECURITY_ALERT,
    actionData: {
      alertType
    }
  })
}

/**
 * Create a promotional notification
 * @param {Object} params - Promotional notification parameters
 * @param {string} params.userId - User ID
 * @param {string} params.title - Promotion title
 * @param {string} params.body - Promotion message
 * @param {Object} params.promotionData - Additional promotion data
 */
export const createPromotionalNotification = async ({
  userId,
  title,
  body,
  promotionData = {}
}) => {
  return createNotification({
    userId,
    title,
    body,
    type: NOTIFICATION_TYPES.PROMOTION,
    actionType: NOTIFICATION_ACTIONS.PROMOTION,
    actionData: promotionData
  })
}

/**
 * Create a system notification
 * @param {Object} params - System notification parameters
 * @param {string} params.userId - User ID
 * @param {string} params.title - System notification title
 * @param {string} params.body - System notification message
 * @param {string} params.systemActionType - System action type
 */
export const createSystemNotification = async ({
  userId,
  title,
  body,
  systemActionType = 'general'
}) => {
  return createNotification({
    userId,
    title,
    body,
    type: NOTIFICATION_TYPES.SYSTEM,
    actionType: systemActionType,
    actionData: {
      systemActionType
    }
  })
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Mark multiple notifications as read
 * @param {Array<string>} notificationIds - Array of notification IDs
 * @returns {Promise<Array>} Updated notifications
 */
export const markNotificationsAsRead = async (notificationIds) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', notificationIds)
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    throw error
  }
}

/**
 * Get unread notifications count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export const getUnreadNotificationsCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error getting unread notifications count:', error)
    return 0
  }
}

/**
 * Delete old notifications (cleanup utility)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<number>} Number of deleted notifications
 */
export const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select()

    if (error) throw error
    return data?.length || 0
  } catch (error) {
    console.error('Error cleaning up old notifications:', error)
    throw error
  }
}