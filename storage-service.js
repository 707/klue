// [NOT-38] Storage Service - IndexedDB persistence for Service Worker
// Uses native IndexedDB API (Service Workers can't use Dexie with top-level await)

/**
 * Save Orama index to IndexedDB
 * @param {Object} serializedIndex - The serialized Orama index
 * @returns {Promise<void>}
 */
export async function saveOramaIndex(serializedIndex) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KnowledgeClipperDB');

    request.onerror = () => reject(request.error);

    request.onsuccess = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('oramaIndex')) {
        db.close();
        reject(new Error('oramaIndex table not found - open panel first'));
        return;
      }

      const transaction = db.transaction(['oramaIndex'], 'readwrite');
      const store = transaction.objectStore('oramaIndex');

      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        const addRequest = store.add({
          timestamp: Date.now(),
          data: serializedIndex
        });

        addRequest.onsuccess = () => {
          console.log('💾 [NOT-38] Orama index saved to IndexedDB');
          db.close();
          resolve();
        };

        addRequest.onerror = () => {
          db.close();
          reject(addRequest.error);
        };
      };

      clearRequest.onerror = () => {
        db.close();
        reject(clearRequest.error);
      };
    };
  });
}

/**
 * Load Orama index from IndexedDB
 * @returns {Promise<Object|null>} - Serialized index or null
 */
export async function loadOramaIndex() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KnowledgeClipperDB');

    request.onerror = () => reject(request.error);

    request.onsuccess = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('oramaIndex')) {
        console.log('📭 [NOT-38] oramaIndex table not found');
        db.close();
        resolve(null);
        return;
      }

      const transaction = db.transaction(['oramaIndex'], 'readonly');
      const store = transaction.objectStore('oramaIndex');
      const index = store.index('timestamp');

      const cursorRequest = index.openCursor(null, 'prev');

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          console.log('📂 [NOT-38] Found saved Orama index');
          db.close();
          resolve(cursor.value.data);
        } else {
          db.close();
          resolve(null);
        }
      };

      cursorRequest.onerror = () => {
        db.close();
        reject(cursorRequest.error);
      };
    };
  });
}
