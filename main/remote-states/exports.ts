import {shell} from 'electron';
import {ExportsRemoteState, RemoteStateHandler} from '../common/types';
import Export from '../export';

const exportsRemoteState: RemoteStateHandler<ExportsRemoteState> = sendUpdate => {
  const getState = (exportId: string) => {
    const exportInstance = Export.fromId(exportId);

    if (!exportInstance) {
      return;
    }

    return exportInstance.data;
  };

  const subscribe = (exportId: string) => {
    const exportInstance = Export.fromId(exportId);

    if (!exportInstance) {
      return;
    }

    const callback = () => {
      sendUpdate(exportInstance.data, exportId);
    };

    exportInstance.on('updated', callback);
    return () => {
      exportInstance.off('updated', callback);
    };
  };

  const actions = {
    cancel: (exportId: string) => {
      Export.fromId(exportId)?.cancel();
    },
    copy: (exportId: string) => {
      Export.fromId(exportId)?.conversion?.copy();
    },
    retry: (exportId: string) => {
      Export.fromId(exportId)?.retry();
    },
    openInEditor: (exportId: string) => {
      Export.fromId(exportId)?.video?.openEditorWindow?.();
    },
    showInFolder: (exportId: string) => {
      const exportInstance = Export.fromId(exportId);

      if (!exportInstance) {
        return;
      }

      if (exportInstance.finalFilePath && !exportInstance.data.disableOutputActions) {
        shell.showItemInFolder(exportInstance.finalFilePath);
      }
    }
  } as any;

  return {
    subscribe,
    getState,
    actions
  };
};

export default exportsRemoteState;
export const name = 'exports';
