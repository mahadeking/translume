// Tiny promise-based IndexedDB wrapper. No deps.
// Stores: meta (Recording), blobs (Blob), comments (Comment), folders (Folder)

const DB_NAME = "translume";
const DB_VERSION = 1;

export type StoreName = "meta" | "blobs" | "comments" | "folders";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("blobs")) {
        db.createObjectStore("blobs");
      }
      if (!db.objectStoreNames.contains("comments")) {
        const s = db.createObjectStore("comments", { keyPath: "id" });
        s.createIndex("recordingId", "recordingId", { unique: false });
      }
      if (!db.objectStoreNames.contains("folders")) {
        db.createObjectStore("folders", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export const idb = {
  get: <T>(store: StoreName, key: IDBValidKey) =>
    tx<T>(store, "readonly", (s) => s.get(key) as IDBRequest<T>),

  getAll: <T>(store: StoreName) =>
    tx<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>),

  put: <T>(store: StoreName, value: T, key?: IDBValidKey) =>
    tx<IDBValidKey>(store, "readwrite", (s) =>
      key !== undefined
        ? s.put(value as unknown as object, key)
        : s.put(value as unknown as object)
    ),

  delete: (store: StoreName, key: IDBValidKey) =>
    tx<undefined>(store, "readwrite", (s) => s.delete(key) as IDBRequest<undefined>),

  getAllByIndex: <T>(store: StoreName, index: string, value: IDBValidKey) =>
    openDB().then(
      (db) =>
        new Promise<T[]>((resolve, reject) => {
          const t = db.transaction(store, "readonly");
          const req = t.objectStore(store).index(index).getAll(value);
          req.onsuccess = () => resolve(req.result as T[]);
          req.onerror = () => reject(req.error);
        })
    ),
};
