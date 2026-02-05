import { useModalRouter } from '@/game/context/ModalRouterContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/client';
import modalStyles from './Modal.module.css';
import Button from '@/ui/components/Button';
import Modal from './Modal';
import { useAuth } from '@/auth/context/AuthContext';
import { useDialog } from '@/ui/context/DialogContext';
import { deleteAccount } from '@/app/actions/auth';

const SettingsModal = () => {
  const { isLoggedIn } = useAuth();
  const { openModal, closeModal, goBack } = useModalRouter();
  const router = useRouter();
  const { showDialog, hideDialog } = useDialog();

  // Don't render auth buttons until we know the auth state
  const showAuthButton = isLoggedIn !== null;

  const handleSignOut = () => {
    showDialog({
      title: 'Sign Out',
      description: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      variant: 'ok',
      onConfirm: async () => {
        await auth.signOut();
        hideDialog();
        showDialog({
          title: 'Signed Out',
          description: 'You have been successfully signed out.',
          confirmText: 'OK',
          cancelText: '',
          variant: 'ok',
          onConfirm: () => {
            hideDialog();
            closeModal();
          },
        });
      },
    });
  };

  const handleDeleteAccount = () => {
    showDialog({
      title: 'Delete Account',
      description:
        'Are you sure you want to delete your account? This action cannot be undone.',
      confirmText: 'Confirm Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        const result = await deleteAccount();
        if (result.success) {
          await auth.signOut();
          hideDialog();
          showDialog({
            title: 'Account Deleted',
            description: 'Your account has been successfully deleted.',
            confirmText: 'OK',
            cancelText: '',
            variant: 'ok',
            onConfirm: () => {
              hideDialog();
              closeModal();
              router.push('/');
            },
          });
        } else {
          hideDialog();
          alert(result.error || 'Failed to delete account. Please try again.');
        }
      },
    });
  };

  return (
    <Modal>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>Settings</h2>

        {showAuthButton &&
          (isLoggedIn ? (
            <>
              <Button
                fill
                size='lg'
                variant='ok'
                type='button'
                onClick={handleSignOut}
              >
                Sign Out
              </Button>

              <Button
                fill
                size='lg'
                variant='danger'
                type='button'
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </>
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

        <Button
          fill
          size='lg'
          type='button'
          onClick={() => openModal('how-to-play')}
        >
          How to Play
        </Button>

        <Button fill size='lg' type='button' onClick={goBack}>
          Go Back
        </Button>
      </div>
    </Modal>
  );
};

export default SettingsModal;
