import React from 'react';

import {CancelIcon, MoreIcon} from '../../vectors';

import {connect, ExportsContainer} from '../../containers';

class Exports extends React.Component {
  static defaultProps = {
    exports: new Map()
  }

  render() {
    const {exports, add, cancel} = this.props;

    return (
      <div>
        <button onClick={add}>Add one</button>
        {
          exports.map(exp => <Export {...exp} cancel={() => cancel(exp.createdAt)}/>)
        }
        <style jsx>{`
            flex: 1;
            overflow-y: auto;
        `}</style>
      </div>
    );
  }
}

export default connect(
  [ExportsContainer],
  ({exports}) => ({exports}),
  ({add, cancel}) => ({add, cancel})
)(Exports);

class Export extends React.Component {
  render() {
    const {
      defaultFileName,
      status,
      text,
      percentage,
      img,
      cancel
    } = this.props;
    console.log(percentage);

    const cancelable = status === 'waiting' || status === 'processing';

    return (
      <div className='export-container'>
        <div className='thumbnail'>
          <div className='icon'>
            {
              cancelable ?
                <CancelIcon fill="white" hoverFill="white" onClick={cancel}/> :
                <MoreIcon fill="white" hoverFill="white"/>
            }
          </div>
          <div className='progress'>
            { status === 'processing' && <Progress percent={Math.min(percentage, 1)}/> }
          </div>
        </div>
        <div className='details'>
          <div className='title'>{defaultFileName}</div>
          <div className='subtitle'>{text}</div>
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

class Progress extends React.Component {
  render() {
    const {percent = 0} = this.props;
    const circumference = 12 * 2 * Math.PI;
    const offset = circumference - percent * circumference;

    return (
      <svg viewBox="0 0 24 24">
        <circle stroke="white" strokeWidth="2" fill='transparent' cx="12" cy="12" r="12" />
        <style jsx>{`
          svg {
            width: 24px;
            height: 24px;
            overflow: visible;
            transform: rotate(-90deg);
          }

          circle {
            stroke-dasharray: ${circumference} ${circumference};
            stroke-dashoffset: ${offset};
            transition: stroke-dashoffset 0.35s;
          }
        `}</style>
      </svg>
    );
  }
}
