import TrafficLights from 'components/traffic-lights';
import {BackPlainIcon} from 'vectors';
import {UseConversionState} from 'hooks/editor/use-conversion';

const TitleBar = ({conversion, cancel, copy}: {conversion: UseConversionState; cancel: () => any; copy: () => any}) => {
  return (
    <div className="title-bar">
      <div className="left">
        <TrafficLights/>
        <div className="icon" onClick={cancel}>
          <BackPlainIcon fill="white" hoverFill="white" size="100%"/>
        </div>
      </div>
      <div className="right">
        {conversion?.canCopy && <div className="button" onClick={copy}>Copy</div>}
      </div>
      <style jsx>{`
        .title-bar {
          height: 36px;
          padding: 6px 12px 6px 0px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          -webkit-app-region: drag;
        }

        .left {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .right {
          display: flex;
          height: 100%;
        }

        .icon {
          width: 24px;
          height: 24px;
          background: #666666;
          border-radius: 4px;
        }

        .button {
          height: 24px;
          color: white;
          padding: 4px 8px;
          background: #666666;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          line-height: 16px;
          font-weight: 500;
        }

        .button:active,
        .icon:active {
          background: hsla(0, 0%, 100%, 0.2);
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default TitleBar;
