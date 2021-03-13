import sinon from 'sinon';
import {Mutable, PartialDeep} from 'type-fest';
import type {Plugins} from '../../main/plugins';

export const plugins: PartialDeep<Mutable<Plugins>> = {
  recordingPlugins: [],
  sharePlugins: [],
  editPlugins: []
};
