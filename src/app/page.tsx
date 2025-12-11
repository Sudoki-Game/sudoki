import Header from '@/components/Header';
import MenuHandler from '@/components/menu/MenuHandler';
import Sudoku from '@/components/Sudoku';
import { MenuRouterProvider } from '@/context/MenuRouterContext';
import { SudokuProvider } from '@/context/SudokuContext';

export default function Home() {
  return (
    <MenuRouterProvider>
      <SudokuProvider>
        <Header />
        <main>
          <Sudoku />
          <MenuHandler />
        </main>
      </SudokuProvider>
    </MenuRouterProvider>
  );
}

