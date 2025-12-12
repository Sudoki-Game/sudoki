import Image from 'next/image';
import { MAX_LIVES } from '@/util/constants';
import './SudokuStats.css';

interface SudokuStatsProps {
  score: number;
  lives: number;
}

const SudokuStats = ({ score, lives }: SudokuStatsProps) => {
  return (
    <div className='sudoku__stats'>
      <div className='sudoku__stat-container'>
        <span className='sudoku__stat'>Score</span>
        <span className='sudoku__stat sudoku__stat--numerical'>{score}</span>
      </div>

      <div className='sudoku__lives-container'>
        {Array.from({ length: MAX_LIVES }).map((_, i) =>
          i < lives ? (
            <Image
              key={`heart-${i}`}
              src={'/game/heart.svg'}
              alt={'Heart'}
              height={24}
              width={24}
            />
          ) : (
            <Image
              key={`heart-${i}`}
              src={'/game/heart-empty.svg'}
              alt={'Empty Heart'}
              height={24}
              width={24}
            />
          )
        )}
      </div>
    </div>
  );
};

export default SudokuStats;
