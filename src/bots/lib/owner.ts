import { cookies } from 'next/headers';
import { serverAuth } from '@/firebase/server';
import { getUserData } from '@/user/lib/server';

function hasTruthyAdminFlag(userData: unknown): boolean {
  if (!userData || typeof userData !== 'object') {
    return false;
  }

  const record = userData as Record<string, unknown>;
  return record.isAdmin === true;
}

export async function isBotOwner(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    return false;
  }

  try {
    const decodedToken = await serverAuth.verifyIdToken(session);
    const hasAdminClaim = decodedToken.isAdmin === true;

    if (hasAdminClaim) {
      return true;
    }

    const userData = await getUserData(decodedToken.uid);
    return hasTruthyAdminFlag(userData);
  } catch (error) {
    console.error('[BotsOwner] Failed to verify session token:', error);
    return false;
  }
}

export async function assertBotOwner(): Promise<void> {
  const owner = await isBotOwner();
  if (!owner) {
    throw new Error('Unauthorized');
  }
}
