import TrafficLights from 'components/traffic-lights';
import {BackPlainIcon, MoreIcon} from 'vectors';
import {UseConversionState} from 'hooks/editor/use-conversion';
import {MenuItemConstructorOptions} from 'electron';
import {ExportStatus} from '../../../common/types';
import {useMemo} from 'react';
import IconMenu from '../../icon-menu';
import {ipcRenderer} from 'electron-better-ipc';

const TitleBar = ({conversion, cancel, copy, retry, showInFolder}: {conversion: UseConversionState; cancel: () => any; copy: () => any; retry: () => any; showInFolder: () => void}) => {
  const shouldClose = async () => {
    if (conversion.status === ExportStatus.inProgress) {
      await ipcRenderer.callMain('show-exports-background-dialog');
    }

    return true;
  };

  const menuTemplate = useMemo(() => {
    const template: MenuItemConstructorOptions[] = [];

    if (conversion?.canCopy) {
      template.push({
        label: 'Copy',
        click: () => copy()
      }, {
        type: 'separator'
      });
    }

    if (conversion?.status === ExportStatus.completed) {
      template.push({
        label: 'Show in Finder',
        click: () => showInFolder()
      });
    }

    return template;
  }, [conversion?.canCopy, conversion?.status]);

  const canRetry = [ExportStatus.canceled, ExportStatus.failed].includes(conversion?.status);

  return (
    <div className="title-bar">
      <div className="left">
        <TrafficLights shouldClose={shouldClose}/>
        <div className="icon" onClick={cancel}>
          <BackPlainIcon fill="white" hoverFill="white" size="100%"/>
        </div>
      </div>
      <div className="right">
        {canRetry && <div className="button" onClick={retry}>Retry</div>}
        {
          menuTemplate.length > 0 && (
            <div className="icon">
              <IconMenu
                icon={MoreIcon}
                fill="white"
                hoverFill="white"
                activeFill="white"
                size="20px"
                template={menuTemplate}
              />
            </div>
          )
        }
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
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-app-region: no-drag;
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
