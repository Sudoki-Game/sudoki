import Header from '@/components/Header';
import Sudoku from '@/components/Sudoku';
import { SudokuProvider } from '@/context/SudokuContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function Home() {
  return (
    <main>
      <ThemeProvider>
        <SudokuProvider>
          <Header />
          <Sudoku />
        </SudokuProvider>
      </ThemeProvider>
    </main>
  );
}

