import styled from './Copyright.module.css';

const Copyright = () => {
  return (
    <a
      className={styled.copyright}
      href='https://dylanalmond.net'
      target='_blank'
      rel='noopener noreferrer'
    >
      @{new Date().getFullYear()} Dylan Almond
    </a>
  );
};

export default Copyright;
