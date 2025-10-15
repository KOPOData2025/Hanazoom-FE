import { useState, useEffect } from 'react';

export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {

    setIsOffline(!navigator.onLine);
    setIsOnline(navigator.onLine);


    const handleOnline = () => {
      setIsOffline(false);
      setIsOnline(true);
    };


    const handleOffline = () => {
      setIsOffline(true);
      setIsOnline(false);
    };


    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);


    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOffline, isOnline };
};
