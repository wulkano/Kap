import PropTypes from 'prop-types';
import React from 'react';

const SpinnerIcon = ({stroke = 'var(--kap)'}) => (
  <svg viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7" strokeWidth="1" fill="none"/>
    <style jsx>{`
      circle {
        fill: transparent;
        stroke: ${stroke};
        stroke-linecap: round;
        stroke-dasharray: calc(3.14px * 16);
        stroke-dashoffset: 16;
        animation: spinner 3s linear infinite;
      }

      @keyframes spinner {
          0% {
              stroke-dashoffset: 10.56;
          }
          50% {
              stroke-dashoffset: 50.24;
          }
          100% {
              stroke-dashoffset: 0.66;
          }
      }
    `}</style>
  </svg>
);

SpinnerIcon.propTypes = {
  stroke: PropTypes.string
};

export default SpinnerIcon;
