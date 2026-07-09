import type { RecordingHistoryItem } from '../types/recorder.js';

const DB_NAME = 'StudioCast_PRO_DB';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof window === 'undefined' || !window.indexedDB) {
			reject(new Error('IndexedDB is not supported in this environment'));
			return;
		}

		const request = window.indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			reject(request.error || new Error('Failed to open IndexedDB'));
		};

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id' });
			}
		};
	});
}

export async function saveRecordingToDB(item: RecordingHistoryItem): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.put(item);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error || new Error('Failed to save recording'));
	});
}

export async function getSavedRecordings(): Promise<RecordingHistoryItem[]> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();

		request.onsuccess = () => {
			const results: RecordingHistoryItem[] = request.result || [];
			// Sort by timestamp descending (newest first)
			results.sort((a, b) => b.timestamp - a.timestamp);
			resolve(results);
		};
		request.onerror = () => reject(request.error || new Error('Failed to fetch recordings'));
	});
}

export async function updateRecordingTitleInDB(id: string, newTitle: string): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const getRequest = store.get(id);

		getRequest.onsuccess = () => {
			const item = getRequest.result as RecordingHistoryItem;
			if (!item) {
				reject(new Error('Recording not found'));
				return;
			}
			item.title = newTitle;
			const putRequest = store.put(item);
			putRequest.onsuccess = () => resolve();
			putRequest.onerror = () => reject(putRequest.error || new Error('Failed to update title'));
		};
		getRequest.onerror = () =>
			reject(getRequest.error || new Error('Failed to fetch recording for update'));
	});
}

export async function deleteRecordingFromDB(id: string): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.delete(id);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error || new Error('Failed to delete recording'));
	});
}

export async function clearAllRecordingsFromDB(): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.clear();

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error || new Error('Failed to clear recordings'));
	});
}
