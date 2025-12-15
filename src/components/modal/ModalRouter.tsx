'use client';
import { useModalRouter } from '@/context/ModalRouterContext';
import SettingsModal from './SettingsModal';
import GameOverModal from './GameOverModal';
import SolutionModal from './SolutionModal';

const ModalRouter = () => {
  const { activeModal } = useModalRouter();

  if (activeModal === null) return null;

  if (activeModal === 'settings') return <SettingsModal />;
  if (activeModal === 'gameover') return <GameOverModal />;
  if (activeModal === 'solution') return <SolutionModal />;
};

export default ModalRouter;
