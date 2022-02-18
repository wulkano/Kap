import {useState, useEffect, FunctionComponent} from 'react';

interface TrafficLightsProps {
  shouldClose?: () => PromiseLike<boolean>;
}

const TrafficLights: FunctionComponent<TrafficLightsProps> = props => {
  const remote = require('@electron/remote');
  const {systemPreferences} = require('electron-util').api;
  const currentWindow = remote.getCurrentWindow();
  const [tint, setTint] = useState('blue');

  useEffect(() => {
    const setTintColor = () => {
      setTint(systemPreferences.getUserDefault('AppleAquaColorVariant', 'string') === '6' ? 'graphite' : 'blue');
    };

    const tintSubscription = systemPreferences.subscribeNotification('AppleAquaColorVariantChanged', setTintColor);
    setTintColor();

    return () => {
      systemPreferences.unsubscribeNotification(tintSubscription);
    };
  }, []);

  const enabled = {
    close: currentWindow.closable,
    minimize: currentWindow.minimizable,
    maximize: currentWindow.maximizable
  };

  const getClassName = (name: string) => `traffic-light ${name}${enabled[name] ? '' : ' disabled'}`;

  const close = async () => {
    if (!props.shouldClose || await props.shouldClose()) {
      currentWindow.close();
    }
  };

  const minimize = () => {
    currentWindow.minimize();
  };

  const maximize = () => {
    currentWindow.setFullScreen(!currentWindow.isFullScreen());
  };

  return (
    <div className={`traffic-lights ${tint}`}>
      <div className={getClassName('close')} onClick={close}>
        <svg width="12" height="12">
          <circle cx="6" cy="6" r="5.75" strokeWidth="0.5"/>
          <line x1="3.17" y1="3.17" x2="8.83" y2="8.83" stroke="black"/>
          <line x1="3.17" y1="8.83" x2="8.83" y2="3.17" stroke="#760e0e"/>
        </svg>
      </div>
      <div className={getClassName('minimize')} onClick={minimize}>
        <svg width="12" height="12">
          <circle cx="6" cy="6" r="5.75" strokeWidth="0.5"/>
          <line x1="2" y1="6" x2="10" y2="6"/>
        </svg>
      </div>
      <div className={getClassName('maximize')} onClick={maximize}>
        <svg width="12" height="12">
          <circle cx="6" cy="6" r="5.75" strokeWidth="0.5"/>
          <rect x="3.5" y="3.5" width="5" height="5" rx="1" ry="1"/>
          <rect className="background-rect" x="5.5" y="1.5" width="1" height="9" transform="rotate(-45 6 6)"/>
        </svg>
      </div>
      <style jsx>{`
          .traffic-lights {
            display: flex;
            align-items: center;
            height: max-content;
            margin-left: 12px;
          }

          .traffic-light {
            border-radius: 100%;
            height: 12px;
            width: 12px;
            background-color: #ddd;
            margin-right: 8px;
            position: relative;
            -webkit-app-region: no-drag;
          }

          .traffic-light line,
          .traffic-light rect {
            visibility: hidden;
          }

          .traffic-lights:hover line,
          .traffic-lights:hover rect {
            visibility: visible;
          }

          .close line {
            stroke: #580300;
          }

          .close circle {
            stroke: #E24640;
            fill: #ff6155;
          }

          .close:active circle {
            fill: #c1483f;
            stroke: #c1483f;
          }

          .close:active line {
            stroke: #1e0101;
          }

          .minimize line {
            stroke: #a66400;
          }

          .minimize circle {
            stroke: #DFA023;
            fill: #ffc008;
          }

          .minimize:active circle {
            fill: #c0910a;
            stroke: #c0910a;
          }

          .minimize:active line {
            stroke: #5a2800;
          }

          .maximize rect {
            fill: #006500;
            stroke: #006500;
          }

          .maximize:active rect {
            fill: #003200;
            stroke: #003200;
          }

          .maximize circle {
            stroke: #1BAC2C;
            fill: #16d137;
          }

          .maximize .background-rect {
            stroke: #16d137;
            fill: #16d137;
          }

          .maximize:active circle,
          .maximize:active .background-rect {
            fill: #119b29;
            stroke: #119b29;
          }

          .graphite .close circle,
          .graphite .minimize circle,
          .graphite .maximize circle {
            fill: #8f8f94;
            stroke: #606066;
          }

          .graphite .close line,
          .graphite .minimize line {
            stroke: #27272c;
          }

          .maximize rect {
            fill: #27272c;
            stroke: #27272c;
          }

          .graphite .maximize .background-rect {
            fill: #8f8f94;
            stroke: #8f8f94;
          }

          .traffic-light.disabled circle {
            fill: #6b6c6d;
            stroke: #6b6c6d;
          }

          .traffic-light.disabled line,
          .traffic-light.disabled rect {
            visibility: hidden;
          }
        `}</style>
    </div>
  );
};

export default TrafficLights;
