import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import IconMenu from '../icon-menu';
import {CancelIcon, MoreIcon} from '../../vectors';
import {Progress, ProgressSpinner} from './progress';

const stopPropagation = event => event.stopPropagation();

export default class Export extends React.Component {
  static defaultProps = {
    percentage: 0
  }

  state = {}

  componentDidMount() {
    const {remote} = electron;
    const {Menu, MenuItem} = remote;
    const {openInEditor} = this.props;

    const menu = new Menu();
    menu.append(new MenuItem({label: 'Open Original', click: openInEditor}));
    this.setState({menu});
  }

  openFile = () => {
    const {filePath} = this.props;
    if (filePath) {
      electron.remote.shell.showItemInFolder(filePath);
    }
  }

  onDragStart = event => {
    const {createdAt} = this.props;
    event.preventDefault();
    electron.ipcRenderer.send('drag-export', createdAt);
  }

  render() {
    const {
      defaultFileName,
      status,
      text,
      percentage,
      image,
      cancel
    } = this.props;
    const {menu} = this.state;

    const cancelable = status === 'waiting' || status === 'processing';

    return (
      <div draggable className="export-container" onClick={this.openFile} onDragStart={this.onDragStart}>
        <div className="thumbnail">
          <div className="overlay"/>
          <div className="icon" onClick={stopPropagation}>
            {
              cancelable ?
                <CancelIcon fill="white" hoverFill="white" activeFill="white" onClick={cancel}/> :
                <IconMenu icon={MoreIcon} fill="white" hoverFill="white" activeFill="white" onOpen={menu && menu.popup}/>
            }
          </div>
          <div className="progress">
            {
              status === 'processing' && (
                percentage === 0 ?
                  <ProgressSpinner/> :
                  <Progress percent={Math.min(percentage, 1)}/>
              )
            }
          </div>
        </div>
        <div className="details">
          <div className="title">{defaultFileName}</div>
          <div className="subtitle">{text}</div>
        </div>
        <style jsx>{`
          .export-container {
            height: 80px;
            border-bottom: 1px solid #f1f1f1;
            padding: 16px;
            display: flex;
            align-items: center;
            box-sizing: border-box;
          }

          .thumbnail {
            width: 48px;
            height: 48px;
            background: url(${image}) no-repeat center;
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
            background: rgba(0, 0, 0, 0.4);
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
          }

          .title {
            font-size: 12px;
            width: 224px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .subtitle {
            font-size: 12px;
            color: #808080;
            user-select: none;
          }

          .export-container:hover {
            background: #f9f9f9;
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
  }
}

Export.propTypes = {
  defaultFileName: PropTypes.string,
  status: PropTypes.string,
  text: PropTypes.string,
  percentage: PropTypes.number,
  image: PropTypes.string,
  cancel: PropTypes.func,
  openInEditor: PropTypes.func,
  filePath: PropTypes.string,
  createdAt: PropTypes.string
};
