import electron from 'electron';
import React, {useCallback, useMemo} from 'react';
import classNames from 'classnames';

import IconMenu from '../icon-menu';
import {CancelIcon, MoreIcon} from '../../vectors';
import {Progress, ProgressSpinner} from './progress';
import useConversion from '../../hooks/editor/use-conversion';
import {ExportStatus} from '../../common/types';
import util from 'electron-util';
import {useShowWindow} from '../../hooks/use-show-window';

const stopPropagation = event => event.stopPropagation();

const Export = ({id}: {id: string}) => {
  const {state, isLoading, cancel, openInEditor, showInFolder, retry, copy} = useConversion(id);
  useShowWindow(state?.id !== undefined);

  const isCancelable = state?.status === ExportStatus.inProgress;
  const isActionable = state?.filePath && !state?.disableOutputActions;
  const canRetry = [ExportStatus.canceled, ExportStatus.failed].includes(state?.status);

  const onCancel = () => {
    cancel();
  };

  const onClick = () => {
    showInFolder();
  };

  const fileNameClassName = classNames({
    title: true,
    disabled: !isActionable
  });

  const onDragStart = useCallback(event => {
    event.preventDefault();
    if (isActionable) {
      electron.ipcRenderer.send('drag-export', state?.id);
    }
  }, [isActionable, state?.id]);

  const menu = useMemo(() => {
    return util.api.Menu.buildFromTemplate([{
      label: 'Open Original',
      click: openInEditor
    },
    state?.canCopy && {
      label: 'Copy',
      click: () => copy()
    },
    canRetry && {
      label: 'Retry',
      click: () => retry()
    }].filter(Boolean));
  }, [canRetry, retry, openInEditor]);

  if (isLoading) {
    return null;
  }

  return (
    <div draggable className="export-container" onClick={onClick} onDragStart={onDragStart}>
      <div className="thumbnail">
        <div className="overlay"/>
        <div className="icon" onClick={stopPropagation}>
          {
            isCancelable ?
              <div className="icon" onClick={onCancel}>
                <CancelIcon fill="white" hoverFill="white" activeFill="white"/>
              </div> :
              <IconMenu
                fillParent
                icon={MoreIcon}
                fill="white"
                hoverFill="white"
                activeFill="white"
                onOpen={menu.popup}
              />
          }
        </div>
        <div className="progress">
          {
            state.status === ExportStatus.inProgress && (
              state.progress === 0 ?
                <ProgressSpinner/> :
                <Progress percent={Math.min(state.progress, 1)}/>
            )
          }
        </div>
      </div>
      <div className="details">
        <div className={fileNameClassName}>
          {state.title}
        </div>
        <div className="subtitle" title={state.error?.message}>{state.message}{state.error && ` - ${state.error.message}`}</div>
      </div>
      <style jsx>{`
          .export-container {
            height: 80px;
            border-bottom: 1px solid var(--row-divider-color);
            padding: 16px;
            display: flex;
            align-items: center;
            box-sizing: border-box;
          }

          .thumbnail {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
            background: url(${state.image}) no-repeat center;
            background-size: cover;
            border-radius: 4px;
            margin-right: 16px;
            position: relative;
            overflow: hidden;
          }

          .overlay {
            position: absolute;
            width: 100%;
            height: 100%;
            background: var(--thumbnail-overlay-color);
          }

          .icon, .progress {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .details {
            flex: 1;
            width: 224px;
          }

          .title {
            font-size: 12px;
            width: 224px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--title-color);
          }

          .disabled {
            color: var(--switch-disabled-color);
          }

          .subtitle {
            font-size: 12px;
            color: var(--subtitle-color);
            user-select: none;
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .export-container:hover {
            background: var(--row-hover-color);
          }

          .export-container:hover .progress {
            display: none;
          }

          .export-container:not(:hover) .icon {
            display: none;
          }
        `}</style>
    </div>
  );
};

export default Export;
