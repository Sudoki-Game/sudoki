'use client';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import SettingsModal from './SettingsModal';
import GameOverModal from './GameOverModal';
import SolutionModal from './SolutionModal';
import ReportBugModal from './ReportBugModal';
import LeaderboardModal from './LeaderboardModal';
import HowToPlayModal from './HowToPlayModal';

const ModalRouter = () => {
  const { activeModal } = useModalRouter();

  if (activeModal === null) return null;

  if (activeModal === 'settings') return <SettingsModal />;
  if (activeModal === 'gameover') return <GameOverModal onClose={() => {}} />;
  if (activeModal === 'solution') return <SolutionModal />;
  if (activeModal === 'bug-report') return <ReportBugModal />;
  if (activeModal === 'leaderboard') return <LeaderboardModal />;
  if (activeModal === 'how-to-play') return <HowToPlayModal />;
};

export default ModalRouter;
