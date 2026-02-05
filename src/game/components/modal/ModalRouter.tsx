'use client';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import SettingsModal from './SettingsModal';
import GameOverModal from './GameOverModal';
import SolutionModal from './SolutionModal';
import ReportBugModal from './ReportBugModal';
import LeaderboardModal from './LeaderboardModal';
import HowToPlayModal from './HowToPlayModal';

export const MODALS = {
  settings: SettingsModal,
  gameover: GameOverModal,
  solution: SolutionModal,
  'bug-report': ReportBugModal,
  leaderboard: LeaderboardModal,
  'how-to-play': HowToPlayModal,
} as const;

export type ModalType = keyof typeof MODALS;

const ModalRouter = () => {
  const { activeModal } = useModalRouter();

  if (!activeModal) return null;

  const Component = MODALS[activeModal];
  return <Component onClose={() => {}} />;
};

export default ModalRouter;
