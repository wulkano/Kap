import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import {CancelIcon, MoreIcon} from '../../vectors';
import {Progress, ProgressSpinner} from './progress';

export default class Export extends React.Component {
  static defaultProps = {
    percentage: 0
  }

  componentDidMount() {
    const {remote} = electron;
    const {Menu, MenuItem} = remote;
    const {openInEditor} = this.props;

    this.menu = new Menu();
    this.menu.append(new MenuItem({label: 'Open Original', click: openInEditor}));
  }

  openMenu = () => {
    this.menu.popup({});
  }

  render() {
    const {
      defaultFileName,
      status,
      text,
      percentage,
      img,
      cancel
    } = this.props;

    const cancelable = status === 'waiting' || status === 'processing';

    return (
      <div className="export-container">
        <div className="thumbnail" onClick={this.openMenu}>
          <div className="overlay"/>
          <div className="icon">
            {
              cancelable ?
                <CancelIcon fill="white" hoverFill="white" onClick={cancel}/> :
                <MoreIcon fill="white" hoverFill="white"/>
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
            background: url(${img}) no-repeat center;
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
            background: rgba(0, 0, 0, .4);
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
          }

          .export-container:hover {
            background: #F9F9F9;
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
  img: PropTypes.string,
  cancel: PropTypes.func,
  openInEditor: PropTypes.func
};
