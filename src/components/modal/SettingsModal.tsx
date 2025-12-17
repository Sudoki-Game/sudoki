import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
// import { useRouter } from 'next/navigation';

const SettingsModal = () => {
  const { openModal, goBack } = useModalRouter();
  // const router = useRouter();

  return (
    <Modal className='settings-modal'>
      <div className='modal__content'>
        <h2>Settings</h2>

        {/* <button
          className='button button--fill button--lg button--ok'
          type='button'
          onClick={() => router.push('auth')}
        >
          Sign In
        </button> */}

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
