import React from 'react';
import { getServerUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { AuthUser } from '@/types';
import { hasUserCompletedOnboarding } from '@/lib/firebase/firestore';

const OnboardingLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = (await getServerUser()) as AuthUser;
  const hasCompletedOnboarding = await hasUserCompletedOnboarding(user.uid);

  if (hasCompletedOnboarding) {
    redirect('/');
  }

  return children;
};

export default OnboardingLayout;
