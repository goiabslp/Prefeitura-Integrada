
import { Order, User, Signature } from '../types';

const DB_NAME = 'BrandDocDB_v2';
const DB_VERSION = 1;
const STORES = {
  ORDERS: 'orders',
  USERS: 'users',
  SIGNATURES: 'signatures'
};

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.ORDERS)) {
        db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SIGNATURES)) {
        db.createObjectStore(STORES.SIGNATURES, { keyPath: 'id' });
      }
    };
  });
};

// Generic CRUD operations
const getAll = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
};

const save = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const remove = async (storeName: string, id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Specific functions
export const getAllOrders = () => getAll<Order>(STORES.ORDERS);
export const saveOrder = (order: Order) => save(STORES.ORDERS, order);
export const deleteOrder = (id: string) => remove(STORES.ORDERS, id);
export const clearAllOrders = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.ORDERS, 'readwrite');
    const store = transaction.objectStore(STORES.ORDERS);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllUsers = () => getAll<User>(STORES.USERS);
export const saveUser = (user: User) => save(STORES.USERS, user);
export const deleteUser = (id: string) => remove(STORES.USERS, id);

export const getAllSignatures = () => getAll<Signature>(STORES.SIGNATURES);
export const saveSignature = (sig: Signature) => save(STORES.SIGNATURES, sig);
export const deleteSignature = (id: string) => remove(STORES.SIGNATURES, id);
