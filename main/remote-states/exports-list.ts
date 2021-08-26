import {ExportsListRemoteState, RemoteStateHandler} from '../common/types';
import Export from '../export';

const exportsListRemoteState: RemoteStateHandler<ExportsListRemoteState> = sendUpdate => {
  const getState = () => {
    return [...Export.exportsMap.keys()];
  };

  const subscribe = () => {
    const callback = () => {
      sendUpdate([...Export.exportsMap.keys()]);
    };

    Export.events.on('added', callback);
    return () => {
      Export.events.off('added', callback);
    };
  };

  return {
    subscribe,
    getState,
    actions: {}
  };
};

export default exportsListRemoteState;
export const name = 'exports-list';
