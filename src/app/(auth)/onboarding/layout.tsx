import React from 'react';
import { getServerUser } from '@/auth/lib/server';
import { redirect } from 'next/navigation';
import { AuthUser } from '@/types';
import { checkOnboardingComplete } from '@/user/lib/server';

const OnboardingLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = (await getServerUser()) as AuthUser;
  const hasCompletedOnboarding = await checkOnboardingComplete(user.uid);

  if (hasCompletedOnboarding) {
    redirect('/');
  }

  return children;
};

export default OnboardingLayout;
