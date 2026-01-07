import { useModalRouter } from '@/game/context/ModalRouterContext';
import modalStyles from './Modal.module.css';
import BugReport from '../BugReport';
import Button from '@/ui/components/Button';
import Modal from './Modal';

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
