import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
import { useSudoku } from '@/context/SudokuContext';
import { Dynascale } from 'dynascale';
import SudokuGrid from '../SudokuGrid';
import styles from './SolutionModal.module.css';
import modalStyles from './Modal.module.css';
import Button from '../ui/Button';

const SolutionModal = () => {
  const { game, isReady } = useSudoku();
  const { goBack } = useModalRouter();

  return (
    <Modal className={styles.solutionModal}>
      <div className={modalStyles.content}>
        <h2>Solution</h2>

        <Dynascale defaultScale={0} margin={0}>
          <SudokuGrid game={game} showSolution={true} isReady={isReady} />
        </Dynascale>

        <section className={styles.key}>
          <div className={styles.keyPair}>
            <span className={`${styles.keyColor} ${styles.keyColorOk}`}></span>
            <h4>Solved Cell</h4>
          </div>

          <div className={styles.keyPair}>
            <span className={`${styles.keyColor} ${styles.keyColorHint}`}></span>
            <h4>Hint</h4>
          </div>

          <div className={styles.keyPair}>
            <span className={styles.keyColor}></span>
            <h4>Solution</h4>
          </div>
        </section>
        <Button fill size='lg' type='button' onClick={goBack}>
          Go Back
        </Button>
      </div>
    </Modal>
  );
};

export default SolutionModal;
