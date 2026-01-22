import { useModalRouter } from '@/game/context/ModalRouterContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/client';
import modalStyles from './Modal.module.css';
import Button from '@/ui/components/Button';
import Modal from './Modal';
import { useAuth } from '@/auth/context/AuthContext';

const SettingsModal = () => {
  const { isLoggedIn } = useAuth();
  const { openModal, closeModal, goBack } = useModalRouter();
  const router = useRouter();

  // Don't render auth buttons until we know the auth state
  const showAuthButton = isLoggedIn !== null;

  return (
    <Modal>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>Settings</h2>

        {showAuthButton &&
          (isLoggedIn ? (
            <Button
              fill
              size='lg'
              variant='ok'
              type='button'
              onClick={() => {
                auth.signOut();
                closeModal();
              }}
            >
              Sign Out
            </Button>
          ) : (
            <Button
              fill
              size='lg'
              variant='ok'
              type='button'
              onClick={() => router.push('/login')}
            >
              Sign In
            </Button>
          ))}

        <Button
          fill
          size='lg'
          variant='warning'
          type='button'
          onClick={() => openModal('bug-report')}
        >
          Report a Bug
        </Button>

        <Button fill size='lg' type='button' onClick={goBack}>
          Go Back
        </Button>
      </div>
    </Modal>
  );
};

export default SettingsModal;
