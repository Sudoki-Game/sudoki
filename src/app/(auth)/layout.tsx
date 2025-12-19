import React from 'react';
import Image from 'next/image';

const AuthLayout = ({
  children
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <>
      <header style={{ paddingTop: '2.5rem', margin: 'auto' }}>
        <Image
          className='header__logo'
          src={'/logo.svg'}
          alt='Sudoki! Logo'
          loading='eager'
          height={84}
          width={275}
        />
      </header>

      <main style={{ marginBottom: '4rem' }}>{children}</main>

      <a
        className='copyright'
        href='https://dylanalmond.net'
        target='_blank'
        rel='noopener noreferrer'
      >
        @{new Date().getFullYear()} Dylan Almond
      </a>
    </>
  );
};

export default AuthLayout;
