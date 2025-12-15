import Header from '@/components/Header';
import MenuHandler from '@/components/modal/ModalRouter';
import Sudoku from '@/components/Sudoku';
import { ModalRouterProvider } from '@/context/ModalRouterContext';
import { SudokuProvider } from '@/context/SudokuContext';

export default function Home() {
  return (
    <ModalRouterProvider>
      <SudokuProvider>
        <Header />
        <main>
          <Sudoku />
          <MenuHandler />
        </main>
      </SudokuProvider>
    </ModalRouterProvider>
  );
}
