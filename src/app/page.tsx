import Copyright from '@/components/Copyright';
import Header from '@/components/Header';
import Sudoku from '@/components/Sudoku';
import ModalHandler from '@/components/modal/ModalRouter';
import { ModalRouterProvider } from '@/context/ModalRouterContext';
import { SudokuProvider } from '@/context/SudokuContext';
import { getServerUser } from '@/lib/auth/server';
import { hasUserCompletedOnboarding } from '@/lib/firebase/firestore';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getServerUser();

  if (user) {
    // Check user is onboarded
    const hasCompletedOnboarding = await hasUserCompletedOnboarding(user?.uid);

    if (!hasCompletedOnboarding) {
      console.log(hasCompletedOnboarding);
      redirect('/onboarding');
    }
  }

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
