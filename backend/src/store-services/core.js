import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { firestore } from '../firestore.js';

/* =========================
   UTIL FUNCTIONS
========================= */

export const nowIso = () => new Date().toISOString();

export const normalizeRecord = (record) => ({
  ...record,
  created_at: record.created_at ?? record.createdAt ?? null,
  updated_at: record.updated_at ?? record.updatedAt ?? null,
  createdAt: record.createdAt ?? record.created_at ?? null,
  updatedAt: record.updatedAt ?? record.updated_at ?? null,
});

const clone = (value) => JSON.parse(JSON.stringify(value));

/* =========================
   DB DEFAULT STRUCTURE
========================= */

const defaultDb = {
  users: [],
  subjects: [],
  students: [],
  faculties: [],
  courses: [],
  grades: [],
  schedules: [],
  events: [],
  research: [],
  announcements: [],
  disciplineRecords: [],
  messages: [],
  syllabi: [],
};

const collectionKeys = Object.keys(defaultDb);

/* =========================
   STATE
========================= */

let writeQueue = Promise.resolve();
let useFileFallback = false;
let hasLoggedFallback = false;
let fallbackReason = null;

const localDbPath = new URL('../../data/db.json', import.meta.url);

/* =========================
   ERROR HANDLING
========================= */

const isFirestoreUnavailableError = (error) => {
  if (!error) return false;

  const message = String(error.message ?? '').toLowerCase();
  const details = String(error.details ?? '').toLowerCase();

  return (
    error.code === 8 ||
    error.code === 14 ||
    message.includes('resource_exhausted') ||
    message.includes('quota exceeded') ||
    message.includes('unavailable') ||
    message.includes('econnrefused') ||
    details.includes('resource_exhausted') ||
    details.includes('quota exceeded') ||
    details.includes('unavailable') ||
    details.includes('econnrefused')
  );
};

/* =========================
   FALLBACK HANDLING
========================= */

const describeFirestoreError = (error) => {
  const code = error?.code ? String(error.code) : 'unknown';
  const message = String(error?.message ?? error?.details ?? 'unknown error');
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

  if (emulatorHost) {
    return `Firestore emulator at ${emulatorHost} is unavailable (${code}: ${message})`;
  }

  return `Firestore is unavailable (${code}: ${message})`;
};

const logFallbackOnce = () => {
  if (hasLoggedFallback) return;
  hasLoggedFallback = true;
  const reason = fallbackReason ? `: ${fallbackReason}` : '.';
  console.warn(`[store] Firestore unavailable. Using local db.json fallback${reason}`);
};

const loadDbFromFile = async () => {
  try {
    const raw = await readFile(localDbPath, 'utf8');
    const parsed = JSON.parse(raw);

    const base = clone(defaultDb);

    for (const key of collectionKeys) {
      if (Array.isArray(parsed[key])) {
        base[key] = parsed[key].map(normalizeRecord);
      }
    }

    return base;
  } catch {
    return clone(defaultDb);
  }
};

const saveDbToFile = async (db) => {
  const normalized = clone(db);

  for (const key of collectionKeys) {
    normalized[key] = (normalized[key] ?? []).map(normalizeRecord);
  }

  await writeFile(localDbPath, JSON.stringify(normalized, null, 2));
};

/* =========================
   FIRESTORE BATCH
========================= */

const commitBatch = async (operations) => {
  if (!operations.length) return;

  const MAX_BATCH_SIZE = 450;

  for (let i = 0; i < operations.length; i += MAX_BATCH_SIZE) {
    const slice = operations.slice(i, i + MAX_BATCH_SIZE);
    const batch = firestore.batch();

    for (const op of slice) {
      if (op.type === 'set') {
        batch.set(op.ref, op.data, { merge: false });
      } else if (op.type === 'delete') {
        batch.delete(op.ref);
      }
    }

    await batch.commit();
  }
};

/* =========================
   LOAD DB
========================= */

export const loadDb = async () => {
  if (useFileFallback) return loadDbFromFile();

  const db = clone(defaultDb);

  try {
    await Promise.all(
      collectionKeys.map(async (key) => {
        const snapshot = await firestore.collection(key).get();

        db[key] = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
      })
    );
  } catch (error) {
    if (!isFirestoreUnavailableError(error)) throw error;

    useFileFallback = true;
    fallbackReason = describeFirestoreError(error);
    logFallbackOnce();
    return loadDbFromFile();
  }

  return db;
};

/* =========================
   WRITE LOCK
========================= */

export const withWriteLock = (operation) => {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(() => undefined, () => undefined);
  return next;
};

/* =========================
   SAVE DB
========================= */

export const saveDb = async (db) => {
  if (useFileFallback) {
    await saveDbToFile(db);
    return;
  }

  const operations = [];

  try {
    for (const key of collectionKeys) {
      const collectionRef = firestore.collection(key);
      const snapshot = await collectionRef.get();

      const nextRecords = (db[key] ?? []).map(normalizeRecord);
      const nextIds = new Set();

      for (const record of nextRecords) {
        const id = String(record.id ?? '').trim() || randomUUID();
        nextIds.add(id);

        operations.push({
          type: 'set',
          ref: collectionRef.doc(id),
          data: { ...record, id },
        });
      }

      for (const doc of snapshot.docs) {
        if (!nextIds.has(doc.id)) {
          operations.push({
            type: 'delete',
            ref: doc.ref,
          });
        }
      }
    }

    await commitBatch(operations);
  } catch (error) {
    if (!isFirestoreUnavailableError(error)) throw error;

    useFileFallback = true;
    fallbackReason = describeFirestoreError(error);
    logFallbackOnce();
    await saveDbToFile(db);
  }
};

/* =========================
   CRUD HELPERS
========================= */

const toCollectionKey = (collectionName) =>
  collectionName === 'discipline-records'
    ? 'disciplineRecords'
    : collectionName;

const isCollectionAllowed = (name) =>
  Object.keys(defaultDb).includes(name);

/* =========================
   CORE CRUD
========================= */

export const getAll = async (collectionName) => {
  const db = await loadDb();
  const key = toCollectionKey(collectionName);

  if (!isCollectionAllowed(key)) return null;

  return (db[key] ?? []).map(normalizeRecord);
};

export const getById = async (collectionName, id) => {
  const records = await getAll(collectionName);
  if (!records) return null;

  return records.find((r) => String(r.id) === String(id)) ?? null;
};

export const query = async (collectionName, filters) => {
  const records = await getAll(collectionName);
  if (!records) return null;

  return records.filter((record) =>
    Object.entries(filters).every(
      ([k, v]) => String(record[k] ?? '') === String(v)
    )
  );
};

export const createRecord = async (collectionName, data) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const key = toCollectionKey(collectionName);

    if (!isCollectionAllowed(key)) return null;

    const timestamp = nowIso();

    const record = normalizeRecord({
      ...data,
      id: randomUUID(),
      created_at: timestamp,
      updated_at: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    db[key] = [...(db[key] ?? []), record];
    await saveDb(db);

    return record;
  });

export const updateRecord = async (collectionName, id, data) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const key = toCollectionKey(collectionName);

    if (!isCollectionAllowed(key)) return null;

    const records = db[key] ?? [];
    const index = records.findIndex((r) => String(r.id) === String(id));

    const timestamp = nowIso();

    if (index === -1) {
      const created = normalizeRecord({
        ...data,
        id,
        created_at: timestamp,
        updated_at: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      db[key] = [...records, created];
      await saveDb(db);
      return created;
    }

    const updated = normalizeRecord({
      ...records[index],
      ...data,
      id: records[index].id,
      updated_at: timestamp,
      updatedAt: timestamp,
    });

    records[index] = updated;
    db[key] = records;

    await saveDb(db);
    return updated;
  });

export const deleteRecord = async (collectionName, id) =>
  withWriteLock(async () => {
    const db = await loadDb();
    const key = toCollectionKey(collectionName);

    if (!isCollectionAllowed(key)) return false;

    const records = db[key] ?? [];
    const filtered = records.filter((r) => String(r.id) !== String(id));

    if (filtered.length === records.length) return false;

    db[key] = filtered;
    await saveDb(db);

    return true;
  });