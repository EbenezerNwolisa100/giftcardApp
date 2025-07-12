import * as Notifications from 'expo-notifications';

export function setupNotificationListener(onNotification) {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    if (onNotification) onNotification(notification);
  });
  return () => subscription.remove();
} 