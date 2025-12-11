'use client';
import { useMenuRouter } from '@/context/MenuRouterContext';
import SettingsMenu from './SettingsMenu';
import './MenuHandler.css';

const MenuHandler = () => {
  const { activeMenu } = useMenuRouter();

  if (activeMenu === null) return null;

  return (
    <div className='menu-container'>
      <SettingsMenu />
    </div>
  );
};

export default MenuHandler;
