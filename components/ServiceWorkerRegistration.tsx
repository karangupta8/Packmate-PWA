'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      // Check if service worker is already registered
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length === 0) {
          // Only register if no service worker is already registered
          navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
              console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
              console.log('SW registration failed: ', registrationError);
            });
        }
      });
    }
  }, []);

  return null;
}
