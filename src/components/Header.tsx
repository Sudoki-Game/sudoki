'use client';
import Image from 'next/image';
import Logo from '../../public/logo.svg';

const Header = () => {
  return (
    <header className='header'>
      <Image src={Logo} alt='Sudoki! Logo' height={84} width={275} />
    </header>
  );
};

export default Header;
