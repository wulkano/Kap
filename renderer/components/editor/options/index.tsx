import LeftOptions from './left';
import RightOptions from './right';

const Options = () => {
  return (
    <div className="container">
      <LeftOptions/>
      <RightOptions/>
      <style jsx>{`
          .container {
            display: flex;
            flex: 1;
            padding: 0 16px;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            background: var(--background-color);
            z-index: 99;
            height: 48px;
            max-height: 48px;
            flex-shrink: 0;
          }
        `}</style>
    </div>
  );
};

export default Options;
