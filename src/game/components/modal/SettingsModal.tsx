import { useModalRouter } from '@/game/context/ModalRouterContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/client';
import modalStyles from './Modal.module.css';
import Button from '@/ui/components/Button';
import Dialog from '@/ui/components/Dialog';
import Modal from './Modal';
import { useAuth } from '@/auth/context/AuthContext';
import { deleteAccount } from '@/app/actions/auth';
import { useState } from 'react';

const SettingsModal = () => {
  const { isLoggedIn } = useAuth();
  const { openModal, closeModal, goBack } = useModalRouter();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showSignOutSuccess, setShowSignOutSuccess] = useState(false);

  // Don't render auth buttons until we know the auth state
  const showAuthButton = isLoggedIn !== null;

  const handleSignOut = async () => {
    await auth.signOut();
    setShowSignOutConfirm(false);
    setShowSignOutSuccess(true);
  };

  const handleSignOutSuccessClose = () => {
    setShowSignOutSuccess(false);
    closeModal();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        // Sign out on client side
        await auth.signOut();
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
      } else {
        alert(result.error || 'Failed to delete account. Please try again.');
      }
    } catch (error) {
      alert('An error occurred while deleting your account.');
      console.error('Delete account error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSuccessClose = () => {
    setShowDeleteSuccess(false);
    closeModal();
    router.push('/');
  };

  return (
    <>
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
                  onClick={() => setShowSignOutConfirm(true)}
                >
                  Sign Out
                </Button>

                <Button
                  fill
                  size='lg'
                  variant='danger'
                  type='button'
                  onClick={() => setShowDeleteConfirm(true)}
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

        <Button fill size='lg' type='button' onClick={goBack}>
          Go Back
        </Button>
      </div>
    </Modal>

      <Dialog
        open={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={handleSignOut}
        variant="ok"
      />

      <Dialog
        open={showSignOutSuccess}
        onClose={handleSignOutSuccessClose}
        title="Signed Out"
        description="You have been successfully signed out."
        confirmText="OK"
        cancelText=""
        onConfirm={handleSignOutSuccessClose}
        variant="ok"
      />

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteAccount}
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />

      <Dialog
        open={showDeleteSuccess}
        onClose={handleDeleteSuccessClose}
        title="Account Deleted"
        description="Your account has been successfully deleted."
        confirmText="OK"
        cancelText=""
        onConfirm={handleDeleteSuccessClose}
        variant="ok"
      />
    </>
  );
};

export default SettingsModal;
