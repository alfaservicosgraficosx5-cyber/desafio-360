import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { EXACT_SHEET_VALUES } from '../data/userChallengeGrid';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export type MarkerColor = 'yellow' | 'red' | 'green';

export const TOTAL_GOAL = 30000.0;
export const BASE_DAILY_GOAL = TOTAL_GOAL / 365;

export const MONTHS_DISTRIBUTION = [
  { name: 'Janeiro', num: 1, days: 31, quarter: '1º Trimestre' },
  { name: 'Fevereiro', num: 2, days: 28, quarter: '1º Trimestre' },
  { name: 'Março', num: 3, days: 31, quarter: '1º Trimestre' },
  { name: 'Abril', num: 4, days: 30, quarter: '2º Trimestre' },
  { name: 'Maio', num: 5, days: 31, quarter: '2º Trimestre' },
  { name: 'Junho', num: 6, days: 30, quarter: '2º Trimestre' },
  { name: 'Julho', num: 7, days: 31, quarter: '3º Trimestre' },
  { name: 'Agosto', num: 8, days: 31, quarter: '3º Trimestre' },
  { name: 'Setembro', num: 9, days: 30, quarter: '3º Trimestre' },
  { name: 'Outubro', num: 10, days: 31, quarter: '4º Trimestre' },
  { name: 'Novembro', num: 11, days: 30, quarter: '4º Trimestre' },
  { name: 'Dezembro', num: 12, days: 31, quarter: '4º Trimestre' },
];

export interface ChallengeItem {
  numero: number;
  mes: string;
  mesNum: number;
  trimestre: string;
  valor: number;
  status: 'Concluído' | 'Pendente';
  data: string;
  observacoes: string;
}

export interface UserProfileDoc {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  activeChallengeId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ChallengeInstanceDoc {
  id: string;
  ownerId: string;
  title: string;
  goalAmount: number;
  markerColor: MarkerColor;
  paidDeposits: Record<string, string>;
  customNotes: Record<string, string>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type MovementType = 'deposit' | 'undo' | 'reset' | 'restore';

export interface MovementEntryDoc {
  id: string;
  ownerId: string;
  challengeId: string;
  type: MovementType;
  depositNumber: number;
  amount: number;
  description: string;
  createdAt?: Timestamp;
}

export interface BackupSnapshotDoc {
  id: string;
  ownerId: string;
  challengeId: string;
  challengeTitle: string;
  paidCount: number;
  totalSaved: number;
  paidDeposits: Record<string, string>;
  customNotes: Record<string, string>;
  createdAt?: Timestamp;
}

export type InitialSeedMode = 'empty' | 'sample60' | 'legacy_local';

function getDefaultNote(num: number, val: number): string {
  if (val === 500) return 'Depósito Máximo (Dourado)';
  if (val === 1) return 'Depósito Mínimo (Verde)';
  if (num === 1) return 'Início do Desafio 365';
  return '';
}

export function buildChallengeItems(
  paidDeposits: Record<string, string> = {},
  customNotes: Record<string, string> = {}
): ChallengeItem[] {
  const items: ChallengeItem[] = [];
  let currentNum = 1;

  for (const m of MONTHS_DISTRIBUTION) {
    for (let d = 1; d <= m.days; d++) {
      const idx = currentNum - 1;
      const val = EXACT_SHEET_VALUES[idx] || 0;
      const key = String(currentNum);
      const isPaid = Object.prototype.hasOwnProperty.call(paidDeposits, key);
      const dateStr = isPaid ? paidDeposits[key] || '' : '';
      const note =
        Object.prototype.hasOwnProperty.call(customNotes, key) && customNotes[key]
          ? customNotes[key]
          : getDefaultNote(currentNum, val);

      items.push({
        numero: currentNum,
        mes: m.name,
        mesNum: m.num,
        trimestre: m.quarter,
        valor: val,
        status: isPaid ? 'Concluído' : 'Pendente',
        data: dateStr,
        observacoes: note,
      });

      currentNum++;
    }
  }

  return items;
}

export function buildSample60Maps(): {
  paidDeposits: Record<string, string>;
  customNotes: Record<string, string>;
} {
  const paidDeposits: Record<string, string> = {};
  let currentNum = 1;

  for (const m of MONTHS_DISTRIBUTION) {
    for (let d = 1; d <= m.days; d++) {
      if (currentNum <= 60) {
        paidDeposits[String(currentNum)] = `2026-${String(m.num).padStart(2, '0')}-${String(
          Math.min(d, 28)
        ).padStart(2, '0')}`;
      }
      currentNum++;
    }
  }

  return { paidDeposits, customNotes: {} };
}

export function extractMapsFromItems(items: ChallengeItem[]): {
  paidDeposits: Record<string, string>;
  customNotes: Record<string, string>;
} {
  const paidDeposits: Record<string, string> = {};
  const customNotes: Record<string, string> = {};

  for (const item of items) {
    if (!Number.isInteger(item.numero) || item.numero < 1 || item.numero > 365) {
      continue;
    }
    const key = String(item.numero);
    if (item.status === 'Concluído') {
      const safeDate =
        typeof item.data === 'string' && item.data.trim()
          ? item.data.trim().slice(0, 20)
          : new Date().toISOString().split('T')[0];
      paidDeposits[key] = safeDate;
    }
    const defaultNote = getDefaultNote(item.numero, item.valor);
    if (
      typeof item.observacoes === 'string' &&
      item.observacoes.trim() &&
      item.observacoes.trim() !== defaultNote
    ) {
      customNotes[key] = item.observacoes.trim().slice(0, 160);
    }
  }

  return { paidDeposits, customNotes };
}

export function getLegacyLocalStorageItems(): ChallengeItem[] | null {
  try {
    const saved = localStorage.getItem('user_365_deposits_data');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length === 365) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function clearLegacyLocalStorageItems(): void {
  try {
    localStorage.removeItem('user_365_deposits_data');
  } catch {
    // ignore storage errors
  }
}

export async function ensureUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const safeDisplayName = (
    user.displayName ||
    user.email?.split('@')[0] ||
    'Participante'
  )
    .trim()
    .slice(0, 120);
  const safeEmail = (user.email || 'usuario@email.com').trim().slice(0, 254);
  const safePhotoURL = (user.photoURL || '').trim().slice(0, 500);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: safeDisplayName,
        email: safeEmail,
        photoURL: safePhotoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existing = snap.data() as UserProfileDoc;
      if (
        existing.displayName !== safeDisplayName ||
        existing.email !== safeEmail ||
        existing.photoURL !== safePhotoURL
      ) {
        await updateDoc(userRef, {
          displayName: safeDisplayName,
          email: safeEmail,
          photoURL: safePhotoURL,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserProfile(
  userId: string,
  onData: (profile: UserProfileDoc | null) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}`;
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (snap) => {
      onData(snap.exists() ? (snap.data() as UserProfileDoc) : null);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeUserChallenges(
  userId: string,
  onData: (challenges: ChallengeInstanceDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/challenges`;
  const q = query(collection(db, 'users', userId, 'challenges'), where('ownerId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as ChallengeInstanceDoc);
      list.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeChallengeMovements(
  userId: string,
  challengeId: string,
  onData: (movements: MovementEntryDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/challenges/${challengeId}/movements`;
  const q = query(
    collection(db, 'users', userId, 'challenges', challengeId, 'movements'),
    where('ownerId', '==', userId),
    where('challengeId', '==', challengeId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as MovementEntryDoc);
      list.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function recordMovement(
  userId: string,
  challengeId: string,
  payload: {
    type: MovementType;
    depositNumber: number;
    amount: number;
    description: string;
  }
): Promise<void> {
  const movementId = `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `users/${userId}/challenges/${challengeId}/movements/${movementId}`;
  const safeNum = Math.max(0, Math.min(365, Math.trunc(payload.depositNumber)));
  const safeAmount = Math.max(0, Math.min(30000, Number(payload.amount) || 0));
  const safeDesc = payload.description.trim().slice(0, 160) || 'Movimentação registrada';

  try {
    await setDoc(doc(db, 'users', userId, 'challenges', challengeId, 'movements', movementId), {
      id: movementId,
      ownerId: userId,
      challengeId,
      type: payload.type,
      depositNumber: safeNum,
      amount: safeAmount,
      description: safeDesc,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserBackups(
  userId: string,
  onData: (backups: BackupSnapshotDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/backups`;
  const q = query(collection(db, 'users', userId, 'backups'), where('ownerId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as BackupSnapshotDoc);
      list.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function createCloudBackup(
  userId: string,
  challenge: ChallengeInstanceDoc
): Promise<string> {
  const backupId = `bkp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `users/${userId}/backups/${backupId}`;
  const paidDeposits = challenge.paidDeposits || {};
  const customNotes = challenge.customNotes || {};

  let paidCount = 0;
  let totalSaved = 0;
  for (const key of Object.keys(paidDeposits)) {
    const idx = Number(key) - 1;
    if (idx >= 0 && idx < EXACT_SHEET_VALUES.length) {
      paidCount++;
      totalSaved += EXACT_SHEET_VALUES[idx];
    }
  }

  try {
    await setDoc(doc(db, 'users', userId, 'backups', backupId), {
      id: backupId,
      ownerId: userId,
      challengeId: challenge.id,
      challengeTitle: challenge.title.slice(0, 80) || 'Desafio 365',
      paidCount,
      totalSaved: Math.min(TOTAL_GOAL, totalSaved),
      paidDeposits,
      customNotes,
      createdAt: serverTimestamp(),
    });
    return backupId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function restoreCloudBackup(
  userId: string,
  targetChallengeId: string,
  backup: BackupSnapshotDoc
): Promise<void> {
  const path = `users/${userId}/challenges/${targetChallengeId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'challenges', targetChallengeId), {
      paidDeposits: backup.paidDeposits || {},
      customNotes: backup.customNotes || {},
      updatedAt: serverTimestamp(),
    });
    await recordMovement(userId, targetChallengeId, {
      type: 'restore',
      depositNumber: 0,
      amount: backup.totalSaved || 0,
      description: `Backup restaurado (${backup.paidCount}/365 depósitos)`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudBackup(userId: string, backupId: string): Promise<void> {
  const path = `users/${userId}/backups/${backupId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'backups', backupId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createChallengeInstance(
  userId: string,
  options: {
    title: string;
    mode: InitialSeedMode;
    markerColor?: MarkerColor;
    legacyItems?: ChallengeItem[] | null;
  }
): Promise<string> {
  const safeTitle = options.title.trim().slice(0, 80) || 'Desafio 365 Depósitos';
  const challengeId = `ch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `users/${userId}/challenges/${challengeId}`;

  let paidDeposits: Record<string, string> = {};
  let customNotes: Record<string, string> = {};

  if (options.mode === 'sample60') {
    const sample = buildSample60Maps();
    paidDeposits = sample.paidDeposits;
    customNotes = sample.customNotes;
  } else if (options.mode === 'legacy_local' && options.legacyItems) {
    const extracted = extractMapsFromItems(options.legacyItems);
    paidDeposits = extracted.paidDeposits;
    customNotes = extracted.customNotes;
  }

  try {
    await setDoc(doc(db, 'users', userId, 'challenges', challengeId), {
      id: challengeId,
      ownerId: userId,
      title: safeTitle,
      goalAmount: TOTAL_GOAL,
      markerColor: options.markerColor || 'yellow',
      paidDeposits,
      customNotes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', userId), {
      activeChallengeId: challengeId,
      updatedAt: serverTimestamp(),
    });

    if (options.mode === 'legacy_local') {
      clearLegacyLocalStorageItems();
    }

    return challengeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function setActiveChallengeId(
  userId: string,
  challengeId: string | null
): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      activeChallengeId: challengeId ? challengeId : deleteField(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleDepositInFirestore(
  userId: string,
  challengeId: string,
  numero: number,
  nextPaid: boolean,
  existingDate?: string
): Promise<void> {
  if (!Number.isInteger(numero) || numero < 1 || numero > 365) {
    throw new Error('Número de depósito inválido.');
  }
  const path = `users/${userId}/challenges/${challengeId}`;
  const ref = doc(db, 'users', userId, 'challenges', challengeId);
  const amount = EXACT_SHEET_VALUES[numero - 1] || 0;
  const formattedNum = String(numero).padStart(3, '0');

  try {
    const dateValue = existingDate || new Date().toISOString().split('T')[0];
    await updateDoc(ref, {
      [`paidDeposits.${numero}`]: nextPaid ? dateValue : deleteField(),
      updatedAt: serverTimestamp(),
    });

    await recordMovement(userId, challengeId, {
      type: nextPaid ? 'deposit' : 'undo',
      depositNumber: numero,
      amount,
      description: nextPaid
        ? `Depósito #${formattedNum} confirmado`
        : `Depósito #${formattedNum} estornado para pendente`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function clearAllDepositsInFirestore(
  userId: string,
  challengeId: string
): Promise<void> {
  const path = `users/${userId}/challenges/${challengeId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'challenges', challengeId), {
      paidDeposits: {},
      customNotes: {},
      updatedAt: serverTimestamp(),
    });
    await recordMovement(userId, challengeId, {
      type: 'reset',
      depositNumber: 0,
      amount: 0,
      description: 'Todos os 365 depósitos zerados',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function replaceChallengeDepositsInFirestore(
  userId: string,
  challengeId: string,
  items: ChallengeItem[]
): Promise<void> {
  const path = `users/${userId}/challenges/${challengeId}`;
  const { paidDeposits, customNotes } = extractMapsFromItems(items);
  const paidCount = Object.keys(paidDeposits).length;
  const totalSaved = items
    .filter((i) => i.status === 'Concluído')
    .reduce((acc, c) => acc + c.valor, 0);

  try {
    await updateDoc(doc(db, 'users', userId, 'challenges', challengeId), {
      paidDeposits,
      customNotes,
      updatedAt: serverTimestamp(),
    });
    await recordMovement(userId, challengeId, {
      type: 'restore',
      depositNumber: 0,
      amount: Math.min(TOTAL_GOAL, totalSaved),
      description: `Lista atualizada/restaurada (${paidCount}/365 concluídos)`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateChallengeMarkerColor(
  userId: string,
  challengeId: string,
  markerColor: MarkerColor
): Promise<void> {
  const path = `users/${userId}/challenges/${challengeId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'challenges', challengeId), {
      markerColor,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function renameChallengeInstance(
  userId: string,
  challengeId: string,
  newTitle: string
): Promise<void> {
  const safeTitle = newTitle.trim().slice(0, 80);
  if (!safeTitle) return;
  const path = `users/${userId}/challenges/${challengeId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'challenges', challengeId), {
      title: safeTitle,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteChallengeInstance(
  userId: string,
  challengeId: string
): Promise<void> {
  const path = `users/${userId}/challenges/${challengeId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'challenges', challengeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
