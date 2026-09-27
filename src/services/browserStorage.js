// Browser-only storage for the local shop editor. This is per browser/device,
// not shared hosting storage. The app caps its records at 1 GiB.
const DB_NAME = 'shilpon-browser-store'
const DB_VERSION = 1
const STORE_NAME = 'records'
export const MAX_BROWSER_STORE_BYTES = 1024 ** 3
const recordKeys = ['products', 'categories', 'assets', 'settings', 'cart']
let databasePromise

function openDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('This browser does not support IndexedDB.'))
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not open browser storage.'))
  })
  return databasePromise
}

function jsonBytes(value) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}

export async function readBrowserRecord(key) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not read browser storage.'))
  })
}

export async function writeBrowserRecord(key, value) {
  const db = await openDatabase()
  const all = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error || new Error('Could not check browser storage.'))
  })
  const used = all.reduce((sum, item) => sum + jsonBytes(item), 0)
  const previous = await readBrowserRecord(key)
  const nextBytes = used - (previous === undefined ? 0 : jsonBytes(previous)) + jsonBytes(value)
  if (nextBytes > MAX_BROWSER_STORE_BYTES) throw new Error('Shilpon photo storage limit reached (1 GB). Remove unused photos or videos to save more.')
  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate()
    const available = Math.max(0, (estimate.quota || MAX_BROWSER_STORE_BYTES) - (estimate.usage || 0))
    if (jsonBytes(value) > available) throw new Error('This browser device is low on storage. Free some disk space or use optimized photos.')
  }
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(value, key)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error || new Error('Browser storage is full.'))
    transaction.onabort = () => reject(transaction.error || new Error('Browser storage is full.'))
  })
}

export async function deleteBrowserRecord(key) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(key)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error || new Error('Could not clear browser storage.'))
  })
}

export async function loadOrMigrateRecord(key, legacyKey, fallback) {
  const stored = await readBrowserRecord(key)
  if (stored !== undefined) return stored
  let legacy
  try {
    const raw = localStorage.getItem(legacyKey)
    if (raw) legacy = JSON.parse(raw)
  } catch { /* Retain the default if old browser data cannot be read. */ }
  if (legacy === undefined) return fallback
  await writeBrowserRecord(key, legacy)
  localStorage.removeItem(legacyKey)
  return legacy
}

export async function requestPersistentBrowserStorage() {
  if (navigator.storage?.persist) await navigator.storage.persist()
}

export function getBrowserStorageKeys() {
  return recordKeys
}
