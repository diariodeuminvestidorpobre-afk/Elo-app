import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// VAPID public key - will be generated on backend
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv-GyuBGpqGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIV5qWQlGmqHXjGQm0d9x5qNKqWZkL5g2Qkk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export function usePushNotifications() {
  const [subscription, setSubscription] = useState(null);
  const [permission, setPermission] = useState(Notification.permission);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupported(isSupported);

    if (!isSupported) {
      console.log('Push notifications not supported');
      return;
    }

    // Register service worker
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
        
        // Check for existing subscription
        return registration.pushManager.getSubscription();
      })
      .then(existingSub => {
        if (existingSub) {
          setSubscription(existingSub);
        }
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }, []);

  const requestPermission = async () => {
    if (!supported) {
      return { success: false, error: 'Notificações push não suportadas' };
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== 'granted') {
        return { success: false, error: 'Permissão negada' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error requesting permission:', error);
      return { success: false, error: error.message };
    }
  };

  const subscribe = async () => {
    if (!supported || permission !== 'granted') {
      return { success: false, error: 'Permissão não concedida' };
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      setSubscription(sub);

      // Send subscription to backend
      try {
        await axios.post(`${API}/notifications/subscribe`, {
          subscription: sub.toJSON()
        }, { withCredentials: true });
      } catch (apiError) {
        console.error('Failed to save subscription on backend:', apiError);
        // Continue even if backend fails
      }

      return { success: true, subscription: sub };
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return { success: false, error: error.message };
    }
  };

  const unsubscribe = async () => {
    if (!subscription) {
      return { success: false, error: 'Não há inscrição ativa' };
    }

    try {
      await subscription.unsubscribe();
      
      // Notify backend
      try {
        await axios.post(`${API}/notifications/unsubscribe`, {
          endpoint: subscription.endpoint
        }, { withCredentials: true });
      } catch (apiError) {
        console.error('Failed to remove subscription from backend:', apiError);
      }

      setSubscription(null);
      return { success: true };
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    supported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    isSubscribed: !!subscription
  };
}
