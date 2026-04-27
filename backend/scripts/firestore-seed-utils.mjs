import { randomUUID } from 'node:crypto';
import 'dotenv/config';

import admin from 'firebase-admin';

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

const normalizeRecord = (record) => ({
  ...record,
  created_at: record.created_at ?? record.createdAt ?? null,
  updated_at: record.updated_at ?? record.updatedAt ?? null,
  createdAt: record.createdAt ?? record.created_at ?? null,
  updatedAt: record.updatedAt ?? record.updated_at ?? null,
});

const ensureAdminApp = () => {
  if (admin.apps.length) return admin.firestore();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const shouldUseEmulator = String(process.env.FIREBASE_USE_EMULATOR ?? '').toLowerCase() === 'true';
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  const hasServiceAccountEnv = Boolean(clientEmail && privateKey);

  if (!projectId) {
    throw new Error('Missing Firebase Admin environment variable: FIREBASE_PROJECT_ID');
  }

  if (shouldUseEmulator) {
    if (!emulatorHost) {
      throw new Error('FIREBASE_USE_EMULATOR is true but FIRESTORE_EMULATOR_HOST is missing');
    }

    admin.initializeApp({ projectId });
    process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
    return admin.firestore();
  }

  if (!hasServiceAccountEnv) {
    throw new Error('Missing Firebase Admin service account environment variables: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY');
  }

  admin.initializeApp({
    projectId,
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });

  return admin.firestore();
};

export const firestore = ensureAdminApp();

export const nowIso = () => new Date().toISOString();
export const createId = () => randomUUID();

export const normalizeDb = (db) => {
  const next = structuredClone(defaultDb);

  for (const key of collectionKeys) {
    if (Array.isArray(db?.[key])) {
      next[key] = db[key].map(normalizeRecord);
    }
  }

  return next;
};

export const loadDbFromFirestore = async () => {
  const db = structuredClone(defaultDb);

  for (const key of collectionKeys) {
    const snapshot = await firestore.collection(key).get();
    db[key] = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  }

  return db;
};

export const saveDbToFirestore = async (db) => {
  const normalizedDb = normalizeDb(db);

  for (const key of collectionKeys) {
    const collectionRef = firestore.collection(key);
    const snapshot = await collectionRef.get();
    const nextRecords = (normalizedDb[key] ?? []).map(normalizeRecord);
    const nextIds = new Set();
    const operations = [];

    for (const record of nextRecords) {
      const id = String(record.id ?? '').trim() || createId();
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

    const batchLimit = 450;

    for (let i = 0; i < operations.length; i += batchLimit) {
      const batch = firestore.batch();
      for (const op of operations.slice(i, i + batchLimit)) {
        if (op.type === 'set') {
          batch.set(op.ref, op.data, { merge: false });
        } else if (op.type === 'delete') {
          batch.delete(op.ref);
        }
      }
      await batch.commit();
    }
  }
};

export const seedFirestoreDb = async (mutator) => {
  const db = await loadDbFromFirestore();
  const nextDb = await mutator(structuredClone(db));
  await saveDbToFirestore(nextDb ?? db);
  return nextDb ?? db;
};