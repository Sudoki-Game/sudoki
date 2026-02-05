import { useModalRouter } from '@/game/context/ModalRouterContext';
import modalStyles from './Modal.module.css';
import Button from '@/ui/components/Button';
import Modal from './Modal';
import styles from './HowToPlayModal.module.css';

const HowToPlayModal = () => {
  const { closeModal } = useModalRouter();

  const handleDismiss = () => {
    localStorage.setItem('sudoki_tutorial_seen', 'true');
    closeModal();
  };

  return (
    <Modal>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>How to Play</h2>

        <div className={styles.content}>
          <section>
            <h3>Goal</h3>
            <p>
              Fill the 9×9 grid so that each row, column, and 3×3 box contains
              the digits 1-9 without repeating.
            </p>
          </section>

          <section>
            <h3>Controls</h3>
            <ul>
              <li>
                <strong>Select a cell:</strong> Click or tap on an empty cell
              </li>
              <li>
                <strong>Enter a number:</strong> Click or drag the number buttons into any editable cell or use
                your keyboard (1-9)
              </li>
              <li>
                <strong>Erase:</strong> Move the cell off the board or press
                Backspace/Delete
              </li>
              <li>
                <strong>Auto-solve:</strong> Solve a random empty cell when stuck (costs lives!)
              </li>
            </ul>
          </section>

          <section>
            <h3>Scoring</h3>
            <p>
              Complete puzzles to earn points.
              Build daily streaks for bonus points and climb the leaderboard!
            </p>
          </section>
        </div>

        <Button fill size='lg' variant='ok' type='button' onClick={handleDismiss}>
          Got It!
        </Button>
      </div>
    </Modal>
  );
};

export default HowToPlayModal;
