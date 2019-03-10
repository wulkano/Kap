import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {SpinnerIcon} from '../../../vectors';

class Switch extends React.Component {
  render() {
    const {checked, onClick, disabled, loading, onTransitionEnd} = this.props;
    const className = classNames('switch', {checked, disabled, loading});

    return (
      <div className={className} onClick={disabled ? undefined : onClick}>
        <div className="toggle" onTransitionEnd={onTransitionEnd}>
          {loading && <SpinnerIcon/>}
        </div>
        <style jsx>{`
          .switch {
            display: inline-block;
            width: 4.8rem;
            height: 2.4rem;
            border: 1px solid var(--input-border-color);
            border-radius: 2.625em;
            position: relative;
            background-color: var(--input-background-color);
            transition: 0.2s ease-in-out;
            box-sizing: border-box;
          }

          .toggle {
            content: '';
            display: block;
            width: 1.6rem;
            height: 1.6rem;
            border-radius: 50%;
            margin-top: 0.3rem;
            margin-left: 0.3rem;
            position: absolute;
            top: 0;
            left: 0;
            background: gray;
            transition: left 0.12s ease-in-out;
          }

          .checked .toggle {
            left: calc(100% - 2.2rem);
            background: #007aff;
          }

          .disabled {
            cursor: not-allowed;
          }

          .disabled .toggle {
            margin-top: 0.2rem;
            border: 1px solid #ccc;
            background-color: transparent;
          }

          .loading .toggle {
            border: none;
            background: transparent;
            background-size: 100%;
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
  }
}

Switch.propTypes = {
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onTransitionEnd: PropTypes.func
};

export default Switch;
