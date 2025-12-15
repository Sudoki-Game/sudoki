import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
import { useSudoku } from '@/context/SudokuContext';
import { Dynascale } from 'dynascale';
import SudokuGrid from '../SudokuGrid';
import './SolutionModal.css';

const SolutionModal = () => {
  const { game, isReady } = useSudoku();
  const { goBack } = useModalRouter();

  return (
    <Modal className='solution-modal'>
      <div className='modal__content'>
        <h2>Solution</h2>

        <Dynascale defaultScale={0} margin={0}>
          <SudokuGrid game={game} showSolution={true} isReady={isReady} />
        </Dynascale>

        <section className='solution-modal__key'>
          <div className='solution-modal__key-pair'>
            <span className='solution-modal__key-color solution-modal__key-color--ok'></span>
            <h4>Solved Cell</h4>
          </div>

          <div className='solution-modal__key-pair'>
            <span className='solution-modal__key-color solution-modal__key-color--hint'></span>
            <h4>Hint</h4>
          </div>

          <div className='solution-modal__key-pair'>
            <span className='solution-modal__key-color'></span>
            <h4>Solution</h4>
          </div>
        </section>

        <button className='button button--fill button--lg' type='button' onClick={goBack}>
          Go Back
        </button>
      </div>
    </Modal>
  );
};

export default SolutionModal;
