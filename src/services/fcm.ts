import { useEffect, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { createNotification } from '@/services/notifications';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Hook that handles FCM token registration and foreground message handling.
 * Call once at the App level inside AuthProvider.
 */
export function useFcmService() {
  const { user, userProfile } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!user || !userProfile || registered.current) return;

    const initFcm = async () => {
      try {
        const messaging = getMessaging();
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('FCM: Notification permission not granted');
          return;
        }

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        // Store FCM token on user doc
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token),
        });

        registered.current = true;

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log('FCM foreground message:', payload);
          if (payload.notification) {
            // Create an in-app notification for foreground messages
            createNotification({
              userId: user.uid,
              type: 'general',
              title: payload.notification.title || 'New Notification',
              body: payload.notification.body || '',
              data: {},
            });
          }
        });
      } catch (err) {
        console.warn('FCM init error:', err);
        // FCM may not be available in all environments — that's ok
      }
    };

    initFcm();
  }, [user, userProfile]);
}

/**
 * Helper: send a push notification via FCM.
 * Note: Firebase v9 client SDK doesn't support direct send.
 * This creates the in-app notification which triggers push
 * via Firestore trigger or a lightweight HTTP call.
 * For true push without Cloud Functions, the client must
 * be in the foreground or Service Worker handles it.
 */
export { createNotification } from '@/services/notifications';
