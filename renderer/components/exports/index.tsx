import React from 'react';

import useExportsList from '../../hooks/exports/use-exports-list';
import Export from './export';

const Exports = () => {
  const {state: exportList = []} = useExportsList();

  return (
    <div>
      {
        exportList.map(id => (
          <Export
            key={id}
            id={id}/>
        ))
      }
      <style jsx>{`
            flex: 1;
            overflow-y: auto;
            background: var(--background-color);
        `}</style>
    </div>
  );
};

export default Exports;
