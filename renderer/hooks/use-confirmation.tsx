import {ipcRenderer} from 'electron-better-ipc';
import type {MessageBoxOptions, MessageBoxReturnValue} from 'electron/renderer';
import {useCallback} from 'react';

interface UseConfirmationOptions {
  message: string;
  detail?: string;
  confirmButtonText: string;
  cancelButtonText?: string;
}

export const useConfirmation = (
  callback: () => void,
  options: UseConfirmationOptions
) => {
  return useCallback(() => {
    ipcRenderer.callMain<MessageBoxOptions, MessageBoxReturnValue>('show-dialog', {
      type: 'question',
      buttons: [
        options.confirmButtonText,
        options.cancelButtonText ?? 'Cancel'
      ],
      defaultId: 0,
      cancelId: 1,
      message: options.message,
      detail: options.detail
    }).then(response => {
      if (response.response === 0) {
        callback();
      }
    });
  }, [callback]);
};
