import React from 'react';
import Image from 'next/image';
import Copyright from '@/ui/components/Copyright';
import headerStyles from '@/game/components/Header.module.css';
import { getServerUser } from '@/auth/lib/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to Sudoki to save progress and compete on the leaderboard.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: false,
    follow: false,
  },
};

const LoginLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = await getServerUser();

  if (user) {
    redirect('/');
  }

  return (
    <>
      <header className={headerStyles.header}>
        <span></span>
        <Image
          className={headerStyles.logo}
          src={'/logo.svg'}
          alt='Sudoki! Logo'
          loading='eager'
          height={84}
          width={275}
        />
        <span></span>
      </header>

      <main>{children}</main>

      <Copyright />
    </>
  );
};

export default LoginLayout;
