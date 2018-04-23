import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class Switch extends React.Component {
  render() {
    const {checked, onClick, disabled} = this.props;
    const className = classNames({checked, disabled});

    return (
      <div className={className} onClick={disabled ? undefined : onClick}>
        <style jsx>{`
          display: inline-block;
          width: 4.8rem;
          height: 2.4rem;
          border: 1px solid #ddd;
          border-radius: 2.625em;
          position: relative;
          background-color: #fff;
          transition: .2s ease-in-out;

          :after {
            content: "";
            display: block;
            width: 1.6rem;
            height: 1.6rem;
            border-radius: 50%;
            margin-top: .4rem;
            margin-left: .3rem;
            position: absolute;
            top: 0;
            left: 0;
            background: gray;
            transition: left .12s ease-in-out;
          }

          .checked:after {
            left: calc(100% - 2.2rem);
            background: #007aff;
          }

          .disabled {
            cursor: not-allowed;
          }

          .disabled:after {
            margin-top: .3rem;
            border: 1px solid #ccc;
            background-color: #fff;
          }
        `}</style>
      </div>
    );
  }
}

Switch.propTypes = {
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

export default Switch;
