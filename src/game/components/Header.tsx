'use client';
import Image from 'next/image';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import Button from '@/ui/components/Button';
import styles from './Header.module.css';
import { useAuth } from '@/auth/context/AuthContext';

const Header = () => {
  const { isLoggedIn } = useAuth();
  const { openModal } = useModalRouter();

  return (
    <header className={styles.header}>
      <Button size='icon' type='button' onClick={() => openModal('settings')}>
        <Image
          src={'/game/gear.svg'}
          alt='Settings Icon'
          height={32}
          width={32}
        />
      </Button>

      <Image
        className={styles.logo}
        src={'/logo.svg'}
        alt='Sudoki! Logo'
        priority
        fetchPriority='high'
        sizes='(max-width: 768px) 196px, 275px'
        height={84}
        width={275}
      />

      <Button
        disabled={!isLoggedIn}
        size='icon'
        variant='warning'
        type='button'
        onClick={() => openModal('leaderboard')}
      >
        <Image
          src={'/game/crown.svg'}
          alt='Leaderboard Icon'
          height={32}
          width={32}
        />
      </Button>
    </header>
  );
};

export default Header;
