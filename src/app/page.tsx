import Copyright from '@/components/Copyright';
import Header from '@/game/components/Header';
import { ModalRouterProvider } from '@/game/context/ModalRouterContext';
import Sudoku from '@/game/components/Sudoku';
import { SudokuGameProvider } from '@/game/context/SudokuGameContext';
import { getServerUser } from '@/lib/auth/server';
import { checkOnboardingComplete } from '@/user/lib/server';
import { redirect } from 'next/navigation';
import ModalRouter from '@/game/components/modal/ModalRouter';

export default async function Home() {
  const user = await getServerUser();

  if (user) {
    // Check user is onboarded
    const hasCompletedOnboarding = await checkOnboardingComplete(user?.uid);

    if (!hasCompletedOnboarding) {
      console.log(hasCompletedOnboarding);
      redirect('/onboarding');
    }
  }

  return (
    <ModalRouterProvider>
      <Header />
      <main>
        <SudokuGameProvider>
          <Sudoku />
          <ModalRouter />
        </SudokuGameProvider>
      </main>

      <Copyright />
    </ModalRouterProvider>
  );
}
