'use client';
import Image from 'next/image';
import Logo from '../../public/logo.svg';
import GearIcon from '../../public/game/gear.svg';
import CrownIcon from '../../public/game/crown.svg';
import './Header.css';
import { useMenuRouter } from '@/context/MenuRouterContext';

const Header = () => {
  const { openMenu } = useMenuRouter();

  return (
    <header className='header'>
      <button className='button button--icon' type='button' onClick={() => openMenu('settings')}>
        <Image src={GearIcon} alt='Settings Icon' height={32} width={32} />
      </button>

      <Image
        className='header__logo'
        src={Logo}
        alt='Sudoki! Logo'
        loading='eager'
        height={84}
        width={275}
      />

      <button
        disabled
        className='button button--icon button--warning'
        type='button'
        onClick={() => openMenu('leaderboard')}
      >
        <Image src={CrownIcon} alt='Leaderboard Icon' height={32} width={32} />
      </button>
    </header>
  );
};

export default Header;
