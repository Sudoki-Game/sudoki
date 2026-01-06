'use client';
import Image from 'next/image';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import Button from '@/ui/components/Button';
import styles from './Header.module.css';

const Header = () => {
  const { openModal } = useModalRouter();

  return (
    <header className={styles.header}>
      <Button size='icon' type='button' onClick={() => openModal('settings')}>
        <Image src={'/game/gear.svg'} alt='Settings Icon' height={32} width={32} />
      </Button>

      <Image
        className={styles.logo}
        src={'/logo.svg'}
        alt='Sudoki! Logo'
        loading='eager'
        height={84}
        width={275}
      />

      <Button
        disabled
        size='icon'
        variant='warning'
        type='button'
        onClick={() => openModal('leaderboard')}
      >
        <Image src={'/game/crown.svg'} alt='Leaderboard Icon' height={32} width={32} />
      </Button>
    </header>
  );
};

export default Header;
