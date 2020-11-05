import VideoTimeContainer from '../video-time-container';
import useWindowState from '../../../hooks/window-state';
import formatTime from '../../../utils/format-time';
import {useRef, useEffect} from 'react';

type Props = {
  time: number,
  labelTime: number,
  duration: number,
  hidePreview: boolean
};

const Preview = ({time, labelTime, duration, hidePreview}: Props) => {
  const videoRef = useRef<HTMLVideoElement>();
  const {filePath} = useWindowState();
  const src = `file://${filePath}`;

  useEffect(() => {
    if (!hidePreview) {
      videoRef.current.currentTime = time;
    }
  }, [time, hidePreview]);

  return (
    <div className="container" onMouseMove={event => event.stopPropagation()}>
      <video ref={videoRef} preload="auto" src={src} />
      <div className="time">{formatTime(labelTime, {extra: duration})}</div>
      <style jsx>{`
          .container {
            flex: 1;
            position: relative;
          }

          .time {
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: max-content;
            height: 24px;
            background: rgba(0, 0, 0, 0.4);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            font-size: 12px;
            padding: 4px 8px;
          }

          video {
            width: 100%;
            height: 100%;
            border-radius: 4px;
            box-shadow: 0px 0px 16px rgba(0, 0, 0, 0.1);
            ${hidePreview ? 'display: none;' : ''}
          }
        `}</style>
    </div>
  );
};

export default Preview;

// import PropTypes from 'prop-types';
// import React from 'react';

// import formatTime from '../../../utils/format-time';

// class Preview extends React.Component {
//   constructor(props) {
//     super(props);
//     this.videoRef = React.createRef();
//   }

//   shouldComponentUpdate(nextProps) {
//     return nextProps.time !== this.props.time || nextProps.hidePreview !== this.props.hidePreview;
//   }

//   componentDidUpdate(previousProps) {
//     if (previousProps.time !== this.props.time) {
//       this.videoRef.current.currentTime = this.props.time;
//     }
//   }

//   render() {
//     const {labelTime, duration, hidePreview, src} = this.props;

    // return (
    //   <div className="container" onMouseMove={event => event.stopPropagation()}>
    //     <video ref={this.videoRef} preload="auto" src={src}/>
    //     <div className="time">{formatTime(labelTime, {extra: duration})}</div>
    //     <style jsx>{`
    //       .container {
    //         flex: 1;
    //         position: relative;
    //       }

    //       .time {
    //         position: absolute;
    //         bottom: 8px;
    //         left: 50%;
    //         transform: translateX(-50%);
    //         width: max-content;
    //         height: 24px;
    //         background: rgba(0, 0, 0, 0.4);
    //         color: #fff;
    //         display: flex;
    //         align-items: center;
    //         justify-content: center;
    //         border-radius: 4px;
    //         font-size: 12px;
    //         padding: 4px 8px;
    //       }

    //       video {
    //         width: 100%;
    //         height: 100%;
    //         border-radius: 4px;
    //         box-shadow: 0px 0px 16px rgba(0, 0, 0, 0.1);
    //         ${hidePreview ? 'display: none;' : ''}
    //       }
    //     `}</style>
    //   </div>
    // );
//   }
// }

// Preview.propTypes = {
//   time: PropTypes.number,
//   labelTime: PropTypes.number,
//   duration: PropTypes.number,
//   hidePreview: PropTypes.bool,
//   src: PropTypes.string
// };

// export default Preview;
