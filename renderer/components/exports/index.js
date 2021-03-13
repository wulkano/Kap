import electron from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import {connect, ExportsContainer} from '../../containers';
import Export from './export';

class Exports extends React.Component {
  componentDidUpdate(previousProps) {
    if (!previousProps.isMounted && this.props.isMounted) {
      electron.ipcRenderer.send('exports-ready');
    }
  }

  render() {
    const {exports, cancel, openInEditor} = this.props;

    return (
      <div>
        {
          exports.map(exp => (
            <Export
              key={exp.createdAt}
              {...exp}
              cancel={() => cancel(exp.createdAt)}
              openInEditor={() => openInEditor(exp.createdAt)}/>
          ))
        }
        <style jsx>{`
            flex: 1;
            overflow-y: auto;
            background: var(--background-color);
        `}</style>
      </div>
    );
  }
}

Exports.propTypes = {
  exports: PropTypes.arrayOf(PropTypes.object),
  cancel: PropTypes.elementType,
  openInEditor: PropTypes.elementType,
  isMounted: PropTypes.bool
};

export default connect(
  [ExportsContainer],
  ({exports, isMounted}) => ({exports, isMounted}),
  ({cancel, openInEditor}) => ({cancel, openInEditor})
)(Exports);
