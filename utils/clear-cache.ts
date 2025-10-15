
export const clearPWACache = async () => {
  if ('serviceWorker' in navigator) {
    try {

      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ type: 'CLEAR_CACHE' });
      }
      

      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      console.log('PWA cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear PWA cache:', error);
      return false;
    }
  }
  return false;
};


export const forceUpdateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.waiting) {

        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      

      await navigator.serviceWorker.register('/sw.js');
      
      console.log('Service Worker updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update Service Worker:', error);
      return false;
    }
  }
  return false;
};


export const hardRefresh = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {

    window.location.reload();
  } else {

    clearPWACache().then(() => {
      window.location.reload();
    });
  }
};
