import React from 'react';
import PropTypes from 'prop-types';

const Body = ({title, message, detail}) => {
  return (
    <div className="container">
      <h1>{title}</h1>
      <div className="detail">
        {
          detail.split('\n').map(text => (
            <span key={text}>{text}</span>
          ))
        }
      </div>
      {message && <p>{message}</p>}

      <style jsx>{`
        h1 {
          font-size: 1.25rem;
          margin: 0;
          color: var(--title-color);
        }

        .detail {
          margin-top: 8px;
          font-size: 1.125rem;
          max-height: 400px;
          overflow-y: scroll;
          display: flex;
          flex-direction: column;
          color: var(--title-color);
          flex: 1;
        }

        span {
          min-height: 1.125rem;
        }

        p {
          font-size: 1.25rem;
          color: var(--title-color);
          margin: 24px 0 0 0;
          white-space: nowrap;
        }

        .container {
          flex-direction: column;
          display: flex;
          padding: 24px 24px 0 0;
          flex: 1;
        }
      `}</style>
    </div>
  );
};

Body.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  detail: PropTypes.string
};

export default Body;
