import React from 'react';
import Image from 'next/image';
import Copyright from '@/components/Copyright';
import headerStyles from '@/components/Header.module.css';

const AuthLayout = ({
  children
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

export default AuthLayout;
