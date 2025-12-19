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

        <a
          className='copyright'
          href='https://dylanalmond.net'
          target='_blank'
          rel='noopener noreferrer'
        >
          @{new Date().getFullYear()} Dylan Almond
        </a>
      </ModalRouterProvider>
    </SudokuProvider>
  );
}
