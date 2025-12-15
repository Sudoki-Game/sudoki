'use client';
import Image from 'next/image';
import { useModalRouter } from '@/context/ModalRouterContext';
import './Header.css';

const Header = () => {
  const { openModal } = useModalRouter();

  return (
    <header className='header'>
      <button className='button button--icon' type='button' onClick={() => openModal('settings')}>
        <Image src={'/game/gear.svg'} alt='Settings Icon' height={32} width={32} />
      </button>

      <Image
        className='header__logo'
        src={'/logo.svg'}
        alt='Sudoki! Logo'
        loading='eager'
        height={84}
        width={275}
      />

      <button
        disabled
        className='button button--icon button--warning'
        type='button'
        onClick={() => openModal('leaderboard')}
      >
        <Image src={'/game/crown.svg'} alt='Leaderboard Icon' height={32} width={32} />
      </button>
    </header>
  );
};

export default Header;
