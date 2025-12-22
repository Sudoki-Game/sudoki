import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
import BugReport from '../form/BugReport';
import modalStyles from './Modal.module.css';
import Button from '../ui/Button';

const ReportBugModal = () => {
  const { goBack } = useModalRouter();

  return (
    <Modal className='settings-modal'>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>Report a Bug</h2>

        <BugReport />

        <Button fill size='lg' type='button' onClick={goBack}>
          Go Back
        </Button>
      </div>
    </Modal>
  );
};

export default ReportBugModal;
