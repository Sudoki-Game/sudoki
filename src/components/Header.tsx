'use client';
import ThemeToggle from './ThemeToggle';
import Image from 'next/image';
import Github from '@/assets/github.svg';

const Header = () => {
  return (
    <header className='header'>
      <ThemeToggle />

      <h1>Sudoki!</h1>

      <a
        className='button button--outline button--icon'
        href='https://github.com/DylanAlmond/sudoku.git'
        title='Github'
      >
        <Image src={Github} alt='GitHub Icon' />
      </a>
    </header>
  );
};

export default Header;
