import {ExportsListRemoteState} from 'common/types';
import createRemoteStateHook from 'hooks/use-remote-state';

const useExportsList = createRemoteStateHook<ExportsListRemoteState>('exports-list');

export type UseExportsList = ReturnType<typeof useExportsList>;
export type UseExportsListState = UseExportsList['state'];
export default useExportsList;
