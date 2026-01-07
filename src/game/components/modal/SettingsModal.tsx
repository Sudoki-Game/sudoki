import { useModalRouter } from '@/game/context/ModalRouterContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import modalStyles from './Modal.module.css';
import Button from '@/ui/components/Button';
import Modal from './Modal';

const SettingsModal = () => {
  const { openModal, goBack } = useModalRouter();
  const router = useRouter();
  const user = auth.currentUser;

  return (
    <Modal>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>Settings</h2>

        {user == null ? (
          <Button fill size='lg' variant='ok' type='button' onClick={() => router.push('/login')}>
            Sign In
          </Button>
        ) : (
          <Button fill size='lg' variant='ok' type='button' onClick={() => auth.signOut()}>
            Sign Out
          </Button>
        )}

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
