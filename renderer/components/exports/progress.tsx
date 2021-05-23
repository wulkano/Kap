import PropTypes from 'prop-types';
import React from 'react';

import {SpinnerIcon} from '../../vectors';

export const ProgressSpinner = () => (
  <div className="container">
    <SpinnerIcon stroke="#fff"/>
    <style jsx>{`
      .container {
        width: 24px;
        height: 24px;
        animation: spin 3s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }

        50% {
          transform: rotate(720deg);
        }

        100% {
          transform: rotate(1080deg);
        }
      }
    `}</style>
  </div>
);

export const Progress = ({percent}: {percent: number}) => {
  const circumference = 12 * 2 * Math.PI;
  const offset = circumference - (percent * circumference);

  return (
    <svg viewBox="0 0 24 24">
      <circle stroke="white" strokeWidth="2" fill="transparent" cx="12" cy="12" r="12"/>
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
            ${percent === 0 ? '' : 'transition: stroke-dashoffset 0.35s;'}
          }
        `}</style>
    </svg>
  );
};
