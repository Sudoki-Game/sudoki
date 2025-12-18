import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/client';

const SettingsModal = () => {
  const { user } = useAuth();
  const { openModal, goBack } = useModalRouter();
  const router = useRouter();

  return (
    <Modal className='settings-modal'>
      <div className='modal__content'>
        <h2>Settings</h2>

        {user == null ? (
          <button
            className='button button--fill button--lg button--ok'
            type='button'
            onClick={() => router.push('/login')}
          >
            Sign In
          </button>
        ) : (
          <button
            className='button button--fill button--lg button--ok'
            type='button'
            onClick={() => auth.signOut()}
          >
            Sign Out
          </button>
        )}

        <div className='form__field'>
          <p>Need to report a bug?</p>

          <button
            className='button button--fill button--lg button--warning'
            type='button'
            onClick={() => openModal('bug-report')}
          >
            Report a Bug
          </button>
        </div>

        <button className='button button--fill button--lg' type='button' onClick={goBack}>
          Go Back
        </button>
      </div>
    </Modal>
  );
};

export default SettingsModal;
