import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class Switch extends React.Component {
  render() {
    const {checked, onClick, disabled, loading} = this.props;
    const className = classNames({checked, disabled, loading});

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

          .loading:after {
            border: none;
            background: #fff url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTYgMTYiCiAgICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgICA8c3R5bGU+CiAgICAgICAgICAKICAgIEBrZXlmcmFtZXMgc3Bpbm5lciB7CiAgICAgICAgMCUgewogICAgICAgICAgICBzdHJva2UtZGFzaG9mZnNldDogMTAuNTY7CiAgICAgICAgfQogICAgICAgIDUwJSB7CiAgICAgICAgICAgIHN0cm9rZS1kYXNob2Zmc2V0OiA1MC4yNDsKICAgICAgICB9CiAgICAgICAgMTAwJSB7CiAgICAgICAgICAgIHN0cm9rZS1kYXNob2Zmc2V0OiAwLjY2OwogICAgICAgIH0KICAgIH0KCgoKICAgICAgICAgIAogICAgICAgICAgICAKCiAgICAgICAgICBjaXJjbGUgewogICAgICAgICAgICAgIGZpbGw6IHRyYW5zcGFyZW50OwogICAgICAgICAgICAgIHN0cm9rZTogIzAwN2FmZjsKICAgICAgICAgICAgICBzdHJva2UtbGluZWNhcDogcm91bmQ7CiAgICAgICAgICAgICAgc3Ryb2tlLWRhc2hhcnJheTogY2FsYygzLjE0cHggKiAxNik7CiAgICAgICAgICAgICAgc3Ryb2tlLWRhc2hvZmZzZXQ6IDE2OwogICAgICAgICAgICAgIGFuaW1hdGlvbjogc3Bpbm5lciAzcyBsaW5lYXIgaW5maW5pdGU7CiAgICAgICAgICB9CiAgICAgIDwvc3R5bGU+CiAgICAgICAgPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjciIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgPjwvY2lyY2xlPgogICAgPC9zdmc+Cg==') center;
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
  onClick: PropTypes.func.isRequired
};

export default Switch;
