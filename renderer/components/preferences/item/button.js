import React from 'react';
import PropTypes from 'prop-types';

const Button = ({title, onClick, tabIndex}) => (
  <button type="button" tabIndex={tabIndex} onClick={onClick}>
    {title}
    <style jsx>{`
      border: 1px solid var(--input-border-color);
      background: var(--input-background-color);
      transition: border 0.12s ease-in-out;
      height: 2.4rem;
      padding: 0 0.8rem;
      border-radius: 4px;
      color: var(--title-color);
      font-size: 1.2rem;
      text-align: center;
      line-height: 2.4rem;
      outline: none;

      :hover {
        border-color: var(--input-hover-border-color);
      }

      :focus {
        border-color: var(--kap);
      }
    `}</style>
  </button>
);

Button.propTypes = {
  title: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  tabIndex: PropTypes.number.isRequired
};

export default Button;
