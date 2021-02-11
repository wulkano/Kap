
import PCancelable from 'p-cancelable';
import {Format} from '../common/types';
import {Schema} from '../utils/ajv';
import {EditServiceContext, ShareServiceContext} from './service-context';

export interface Service<Config = any> {
  title: string;
  configDescription?: string;
  config?: {[P in keyof Config]: Schema};
}

export interface ShareService<Config = any> extends Service<Config> {
  formats: Format[];
  action: (context: ShareServiceContext) => PromiseLike<void> | PCancelable<void>;
}

export interface EditService<Config = any> extends Service<Config> {
  action: (context: EditServiceContext) => PromiseLike<void> | PCancelable<void>;
}

export interface RecordService<Config = any> extends Service<Config> {
  willStartRecording?: () => {};
  didStartRecording?: () => {};
  didStopRecording?: () => {};
  willEnable?: () => {};
  cleanUp?: () => {};
}
