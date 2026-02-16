import React from 'react';
import Image from 'next/image';
import Copyright from '@/ui/components/Copyright';
import headerStyles from '@/game/components/Header.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Sign In',
  description: 'Complete your secure email sign-in to continue to Sudoki.',
  alternates: {
    canonical: '/finishSignIn',
  },
  robots: {
    index: false,
    follow: false,
  },
};

const FinishSignInLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
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

export default FinishSignInLayout;
