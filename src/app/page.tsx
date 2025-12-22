import Copyright from '@/components/Copyright';
import Header from '@/components/Header';
import Sudoku from '@/components/Sudoku';
import ModalHandler from '@/components/modal/ModalRouter';
import { ModalRouterProvider } from '@/context/ModalRouterContext';
import { SudokuProvider } from '@/context/SudokuContext';

export default function Home() {
  return (
    <SudokuProvider>
      <ModalRouterProvider>
        <Header />
        <main>
          <Sudoku />
          <ModalHandler />
        </main>

        <Copyright />
      </ModalRouterProvider>
    </SudokuProvider>
  );
}
