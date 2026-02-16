import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db } from './client';
import type { ServerUserData } from '@/user/types';
import type { ServerMatch } from '@/match/types';

export type { ServerUserData };
export type { ServerMatch };

export async function getServerUserData(
  userId: string,
): Promise<ServerUserData | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;

  return userSnap.data() as ServerUserData;
}

export async function userExists(userId: string): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
}

export async function createUserEntry(
  userId: string,
  email: string | null,
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const now = Date.now();
  const userDoc: ServerUserData = {
    uid: userId,
    email,
    displayName: '',
    isActive: true,
    createdAt: now,
    lastActive: now,
    combinedScore: 0,
    dailyStreak: 0,
    bestStreak: 0,
    matchesPlayed: 0,
    personalBestScore: 0,
    lastMatchTimestamp: null,
  };

  await setDoc(userRef, userDoc);
}

export async function updateUserDisplayName(
  userId: string,
  displayName: string,
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { displayName }, { merge: true });
}

export async function hasUserCompletedOnboarding(
  userId: string,
): Promise<boolean> {
  const userData = await getServerUserData(userId);
  return userData ? userData.displayName.trim() !== '' : false;
}

export async function isDisplayNameTaken(
  displayName: string,
  excludeUserId?: string,
): Promise<boolean> {
  const displayNameQuery = query(
    collection(db, 'users'),
    where('displayName', '==', displayName.trim()),
  );

  const querySnapshot = await getDocs(displayNameQuery);

  if (querySnapshot.empty) {
    return false;
  }

  // If we're excluding a specific user (e.g., updating their own name), check if it's only their document
  if (excludeUserId) {
    return querySnapshot.docs.some((doc) => doc.id !== excludeUserId);
  }

  return true;
}

export async function getUserMatches(
  userId: string,
  limitCount = 10,
): Promise<ServerMatch[]> {
  const matchesQuery = query(
    collection(db, 'matches'),
    where('userPlayed', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(limitCount),
  );

  const querySnapshot = await getDocs(matchesQuery);
  return querySnapshot.docs.map((doc) => doc.data()) as ServerMatch[];
}
