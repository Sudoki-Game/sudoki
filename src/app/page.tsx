import Header from '@/components/Header';
import Sudoku from '@/components/Sudoku';
import { SudokuProvider } from '@/context/SudokuContext';

export default function Home() {
  return (
    <main>
      <SudokuProvider>
        <Header />
        <Sudoku />
      </SudokuProvider>
    </main>
  );
}

