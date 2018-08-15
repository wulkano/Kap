import React from 'react';

import LeftOptions from './left';
import RightOptions from './right';

export default class Options extends React.Component {
  render() {
    return (
      <div className="container">
        <LeftOptions/>
        <RightOptions/>
        <style jsx>{`
          .container {
            display: flex;
            flex: 1;
            margin: 0 16px;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }
        `}</style>
      </div>
    );
  }
}
