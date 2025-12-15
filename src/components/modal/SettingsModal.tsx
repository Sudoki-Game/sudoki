import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
// import BugReport from '../BugReport';

const SettingsModal = () => {
  const { goBack } = useModalRouter();

  return (
    <Modal className='settings-modal'>
      <div className='modal__content'>
        <h2>Settings</h2>

        {/* <button disabled className='button button--fill button--lg button--warning' type='button'>
          Sign In
        </button> */}

        {/* <BugReport /> */}

        <button className='button button--fill button--lg' type='button' onClick={goBack}>
          Go Back
        </button>
      </div>
    </Modal>
  );
};

export default SettingsModal;
