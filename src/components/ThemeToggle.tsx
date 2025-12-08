'use client';
import { useTheme } from '@/context/ThemeContext';
import Image from 'next/image';
import Sun from '@/assets/sun.svg';
import Moon from '@/assets/moon.svg';

const ThemeToggle = ({ ...props }: React.ComponentProps<'button'>) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className='button button--outline button--icon'
      title='Toggle Theme'
      onClick={toggleTheme}
      {...props}
    >
      {theme === 'dark' ? <Image src={Sun} alt='Sun icon' /> : <Image src={Moon} alt='Moon icon' />}
    </button>
  );
};

export default ThemeToggle;
