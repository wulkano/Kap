import React from 'react';

export default () => {
  return (
    <div>
      <img src="https://getkap.co/static/favicon/kap.svg"/>
      <style jsx>{`
        img {
          width: 58px;
          height: 58px;
        }

        div {
          padding: 24px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
