import Image from 'next/image';
import Logo from '../../public/logo.svg';
import './Header.css';

const Header = () => {
  return (
    <header className='header'>
      <Image
        className='header__logo'
        src={Logo}
        alt='Sudoki! Logo'
        loading='eager'
        height={84}
        width={275}
      />
    </header>
  );
};

export default Header;
