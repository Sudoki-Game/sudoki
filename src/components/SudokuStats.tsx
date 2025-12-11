import Image from 'next/image';
import HeartIcon from '../../public/game/heart.svg';
import EmptyHeartIcon from '../../public/game/heart-empty.svg';
import { MAX_LIVES } from '@/util/constants';
import { useSudoku } from '@/context/SudokuContext';
import './SudokuStats.css';

const SudokuStats = () => {
  const { game } = useSudoku();

  return (
    <div className='sudoku__stats'>
      <div className='sudoku__stat-container'>
        <span className='sudoku__stat'>Score</span>
        <span className='sudoku__stat sudoku__stat--numerical'>{game.score}</span>
      </div>

      <div className='sudoku__lives-container'>
        {Array.from({ length: MAX_LIVES }).map((_, i) =>
          i < game.lives ? (
            <Image key={`heart-${i}`} src={HeartIcon} alt={'Heart'} height={24} />
          ) : (
            <Image key={`heart-${i}`} src={EmptyHeartIcon} alt={'Empty Heart'} height={24} />
          )
        )}
      </div>
    </div>
  );
};

export default SudokuStats;
