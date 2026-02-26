import Header from '@/game/components/Header';
import { ModalRouterProvider } from '@/game/context/ModalRouterContext';
import Sudoku from '@/game/components/Sudoku';
import { SudokuGameProvider } from '@/game/context/SudokuGameContext';
import { getServerUser } from '@/auth/lib/server';
import { checkOnboardingComplete } from '@/user/lib/server';
import { redirect } from 'next/navigation';
import ModalRouter from '@/game/components/modal/ModalRouter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Play Daily Sudoku',
  description:
    'Play Sudoki daily Sudoku puzzles, build streaks, and climb the leaderboard.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Play Daily Sudoku | Sudoki',
    description:
      'Play Sudoki daily Sudoku puzzles, build streaks, and climb the leaderboard.',
    url: '/',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Sudoki - Daily Sudoku and leaderboard competition',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Play Daily Sudoku | Sudoki',
    description:
      'Play Sudoki daily Sudoku puzzles, build streaks, and climb the leaderboard.',
    images: ['/opengraph-image.png'],
  },
};

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

      <SudokuGameProvider>
        <main>
          <Sudoku />
          <ModalRouter />
        </main>
      </SudokuGameProvider>
    </ModalRouterProvider>
  );
}
