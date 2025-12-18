import Sudoku from '@/components/Sudoku';
import ModalHandler from '@/components/modal/ModalRouter';
import { SudokuProvider } from '@/context/SudokuContext';

export default function Home() {
  return (
    <SudokuProvider>
      <Sudoku />
      <ModalHandler />
    </SudokuProvider>
  );
}
