
import styled from 'styled-components';

const Pattern = () => {
  return (
    <StyledWrapper>
      <div className="container" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .container {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0000 18.75%, #3b82f6 0 31.25%, #0000 0),
      linear-gradient(45deg, #0000 18.75%, #3b82f6 0 31.25%, #0000 0),
      linear-gradient(135deg, #0000 18.75%, #3b82f6 0 31.25%, #0000 0),
      linear-gradient(45deg, #0000 18.75%, #3b82f6 0 31.25%, #0000 0);
    background-size: 60px 60px;
    background-position:
      0 0,
      0 0,
      30px 30px,
      30px 30px;
    animation: slide 4s linear infinite;
  }

  @keyframes slide {
    to {
      background-position:
        60px 0,
        60px 0,
        90px 30px,
        90px 30px;
    }
  }`;

export default Pattern;
