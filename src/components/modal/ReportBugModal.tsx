import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
import BugReport from '../form/BugReport';

const ReportBugModal = () => {
  const { goBack } = useModalRouter();

  return (
    <Modal className='settings-modal'>
      <div className='modal__content'>
        <h2>Report a Bug</h2>

        <BugReport />

        <button className='button button--fill button--lg' type='button' onClick={goBack}>
          Go Back
        </button>
      </div>
    </Modal>
  );
};

export default ReportBugModal;
