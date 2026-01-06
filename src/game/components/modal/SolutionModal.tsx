import { useModalRouter } from '@/game/context/ModalRouterContext';
import Modal from './Modal';
import { Dynascale } from 'dynascale';
import SudokuGrid from '../SudokuGrid';
import styles from './SolutionModal.module.css';
import modalStyles from './Modal.module.css';
import Button from '../../../ui/components/Button';
import { useSudokuGame } from '@/game/context/SudokuGameContext';

const SolutionModal = () => {
  const { game, isReady } = useSudokuGame();
  const { goBack } = useModalRouter();

  return (
    <Modal className={styles.solutionModal}>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>Solution</h2>

        <Dynascale defaultScale={0} margin={0}>
          <SudokuGrid game={game} showSolution={true} isReady={isReady} />
        </Dynascale>

        <section className={styles.key}>
          <div className={styles.keyPair}>
            <span className={`${styles.keyColor} ${styles.keyColorOk}`}></span>
            <span>Solved Cell</span>
          </div>

          <div className={styles.keyPair}>
            <span className={`${styles.keyColor} ${styles.keyColorHint}`}></span>
            <span>Hint</span>
          </div>

          <div className={styles.keyPair}>
            <span className={styles.keyColor}></span>
            <span>Solution</span>
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
