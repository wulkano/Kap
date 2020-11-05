
import {Format} from '../common/types';
import {Schema} from '../utils/ajv';
import {ShareServiceContext} from './service-context';

export interface Service<Config = any> {
  title: string;
  configDescription?: string;
  config?: {[P in keyof Config]: Schema};
}

export interface ShareService<Config = any> extends Service<Config> {
  formats: Format[];
  action: (context: ShareServiceContext) => void;
}

export interface EditService<Config = any> extends Service<Config> {
  action: () => {};
}

export interface RecordService<Config = any> extends Service<Config> {
  willStartRecording?: () => {};
  didStartRecording?: () => {};
  didStopRecording?: () => {};
  willEnable?: () => {};
  cleanUp?: () => {};
}
