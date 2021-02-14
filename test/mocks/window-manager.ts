import sinon from 'sinon';
import {SetOptional} from 'type-fest';

import type {WindowManager} from '../../main/windows/manager';

import * as dialogManager from './dialog';

export class MockWindowManager implements SetOptional<
WindowManager,
'setEditor' | 'setCropper' | 'setConfig' | 'setDialog' | 'setExports' | 'setPreferences'
> {
  editor = {
    open: sinon.fake(),
    areAnyBlocking: () => false
  };

  dialog = {
    open: dialogManager.showDialog,
    ...dialogManager
  };
}

export const windowManager = new MockWindowManager();
