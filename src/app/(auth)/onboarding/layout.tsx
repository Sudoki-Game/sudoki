import type React from 'react';
import { getServerUser } from '@/auth/lib/server';
import { redirect } from 'next/navigation';
import { checkOnboardingComplete } from '@/user/lib/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding',
  description: 'Set up your Sudoki profile and leaderboard identity.',
  alternates: {
    canonical: '/onboarding',
  },
  robots: {
    index: false,
    follow: false,
  },
};

const OnboardingLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = await getServerUser();

  if (!user) {
    redirect('/');
  }

  const hasCompletedOnboarding = await checkOnboardingComplete(user.uid);

  if (hasCompletedOnboarding) {
    redirect('/');
  }

  return children;
};

export default OnboardingLayout;
