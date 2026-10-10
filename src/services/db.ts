/**
 * Offline IndexedDB Storage Layer for AgriRhythm: FieldReady
 * Persists fields, inspections, photos, and sync queues resiliently without network.
 */

import { FieldRecord, InspectionRecord, SupportedLanguage } from '../types';

const DB_NAME = 'FieldReadyDB';
const DB_VERSION = 1;

const STORES = {
  FIELDS: 'fields',
  INSPECTIONS: 'inspections',
  SYNC_QUEUE: 'sync_queue'
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.FIELDS)) {
        const fieldStore = db.createObjectStore(STORES.FIELDS, { keyPath: 'id' });
        fieldStore.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.INSPECTIONS)) {
        const inspStore = db.createObjectStore(STORES.INSPECTIONS, { keyPath: 'id' });
        inspStore.createIndex('field_id', 'field_id', { unique: false });
        inspStore.createIndex('visited_at', 'visited_at', { unique: false });
        inspStore.createIndex('sync_status', 'sync_status', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const dbService = {
  // Language Preference (LocalStorage)
  getSavedLanguage(): SupportedLanguage {
    const lang = localStorage.getItem('fieldready_lang');
    if (lang === 'te' || lang === 'hi' || lang === 'en') {
      return lang;
    }
    return 'te'; // Default to Telugu as primary regional language
  },

  setSavedLanguage(lang: SupportedLanguage) {
    localStorage.setItem('fieldready_lang', lang);
  },

  // Fields
  async saveField(field: FieldRecord): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.FIELDS, 'readwrite');
      tx.objectStore(STORES.FIELDS).put(field);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getFields(): Promise<FieldRecord[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.FIELDS, 'readonly');
      const request = tx.objectStore(STORES.FIELDS).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async getField(id: string): Promise<FieldRecord | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.FIELDS, 'readonly');
      const request = tx.objectStore(STORES.FIELDS).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Inspections
  async saveInspection(inspection: InspectionRecord): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.INSPECTIONS, STORES.SYNC_QUEUE], 'readwrite');
      tx.objectStore(STORES.INSPECTIONS).put(inspection);

      if (inspection.sync_status === 'waiting_to_sync' || inspection.sync_status === 'saved_locally') {
        tx.objectStore(STORES.SYNC_QUEUE).put({
          id: inspection.id,
          type: 'inspection',
          payload: inspection,
          queued_at: new Date().toISOString()
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getInspections(fieldId?: string): Promise<InspectionRecord[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INSPECTIONS, 'readonly');
      const store = tx.objectStore(STORES.INSPECTIONS);

      if (fieldId) {
        const index = store.index('field_id');
        const req = index.getAll(fieldId);
        req.onsuccess = () => {
          const results = req.result || [];
          results.sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime());
          resolve(results);
        };
        req.onerror = () => reject(req.error);
      } else {
        const req = store.getAll();
        req.onsuccess = () => {
          const results = req.result || [];
          results.sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime());
          resolve(results);
        };
        req.onerror = () => reject(req.error);
      }
    });
  },

  async getInspection(id: string): Promise<InspectionRecord | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INSPECTIONS, 'readonly');
      const req = tx.objectStore(STORES.INSPECTIONS).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  // Sync Queue
  async getPendingSyncCount(): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
      const req = tx.objectStore(STORES.SYNC_QUEUE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async getPendingSyncItems(): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
      const req = tx.objectStore(STORES.SYNC_QUEUE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async markInspectionsAsSynced(ids: string[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.INSPECTIONS, STORES.SYNC_QUEUE], 'readwrite');
      const inspStore = tx.objectStore(STORES.INSPECTIONS);
      const queueStore = tx.objectStore(STORES.SYNC_QUEUE);

      ids.forEach(id => {
        const getReq = inspStore.get(id);
        getReq.onsuccess = () => {
          if (getReq.result) {
            const updated = {
              ...getReq.result,
              sync_status: 'synced' as const,
              synced_at: new Date().toISOString()
            };
            inspStore.put(updated);
          }
        };
        queueStore.delete(id);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async clearAllData(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.FIELDS, STORES.INSPECTIONS, STORES.SYNC_QUEUE], 'readwrite');
      tx.objectStore(STORES.FIELDS).clear();
      tx.objectStore(STORES.INSPECTIONS).clear();
      tx.objectStore(STORES.SYNC_QUEUE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};
