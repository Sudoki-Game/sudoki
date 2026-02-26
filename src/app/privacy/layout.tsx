import React from 'react';
import Image from 'next/image';
import headerStyles from '@/game/components/Header.module.css';

const PrivacyLayout = async ({
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
    </>
  );
};

export default PrivacyLayout;
