import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';

const SettingsModal = () => {
  const { openModal, goBack } = useModalRouter();

  return (
    <Modal className='settings-modal'>
      <div className='modal__content'>
        <h2>Settings</h2>

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
