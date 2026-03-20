// offline-queue.js – Queue questions when offline, replay when back online
// Uses IndexedDB for persistence across page reloads.

const OfflineQueue = (() => {
  const DB_NAME    = 'edu_tutor_offline';
  const DB_VERSION = 1;
  const STORE      = 'question_queue';

  let db = null;

  async function openDB() {
    if (db) return db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const idb = e.target.result;
        if (!idb.objectStoreNames.contains(STORE)) {
          idb.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess  = e => { db = e.target.result; resolve(db); };
      req.onerror    = e => reject(e.target.error);
    });
  }

  /** Add a question to the offline queue */
  async function enqueue(question, textbookId, language) {
    const idb   = await openDB();
    const entry = { question, textbookId, language, queuedAt: new Date().toISOString() };
    return new Promise((resolve, reject) => {
      const tx    = idb.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req   = store.add(entry);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  /** Get all queued questions */
  async function getAll() {
    const idb = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = idb.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req   = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  /** Remove a queued question by id */
  async function remove(id) {
    const idb = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = idb.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req   = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /** Clear entire queue */
  async function clear() {
    const idb = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = idb.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req   = store.clear();
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /**
   * Try to replay all queued questions.
   * Called automatically when network comes back online.
   * Shows a toast for each replayed question.
   */
  async function replayAll(onAnswer) {
    const queued = await getAll();
    if (!queued.length) return;

    showToast(`📶 Back online! Replaying ${queued.length} queued question(s)…`, 'default');

    for (const entry of queued) {
      try {
        const body = { question: entry.question, language: entry.language };
        if (entry.textbookId) body.textbook_id = entry.textbookId;

        const data = await apiFetch('/chat/ask', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        if (typeof onAnswer === 'function') {
          onAnswer(entry.question, data.answer, data.sources || []);
        }

        await remove(entry.id);
        showToast(`✅ Replayed: "${entry.question.slice(0, 40)}…"`, 'success');
      } catch (err) {
        console.warn('[OfflineQueue] Replay failed for', entry.question, err.message);
      }
    }
  }

  /** Returns count of queued items */
  async function count() {
    const items = await getAll();
    return items.length;
  }

  // Listen for online event and auto-replay
  window.addEventListener('online', () => {
    showToast('📶 Connection restored', 'success');
    replayAll();
  });

  window.addEventListener('offline', () => {
    showToast('📵 You are offline. Questions will be queued.', 'default');
  });

  return { enqueue, getAll, remove, clear, replayAll, count };
})();
