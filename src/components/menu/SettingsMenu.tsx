import { useMenuRouter } from '@/context/MenuRouterContext';

const SettingsMenu = () => {
  const { goBack } = useMenuRouter();

  return (
    <div className='menu'>
      <h2>Settings</h2>
      <button disabled className='button button--lg button--warning' type='button'>
        Sign In
      </button>

      <button className='button button--lg' type='button' onClick={goBack}>
        Go Back
      </button>
    </div>
  );
};

export default SettingsMenu;
