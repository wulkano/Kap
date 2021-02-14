
import PCancelable from 'p-cancelable';
import {Format} from '../common/types';
import {Schema} from '../utils/ajv';
import {EditServiceContext, RecordServiceContext, ShareServiceContext} from './service-context';

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

export type RecordServiceHook = 'willStartRecording' | 'didStartRecording' | 'didStopRecording';

export type RecordService<Config = any> = Service<Config> & {
  [key in RecordServiceHook]: ((context: RecordServiceContext<any>) => PromiseLike<void>) | undefined;
} & {
  willEnable?: () => PromiseLike<boolean>;
  cleanUp?: (persistedState: Record<string, unknown>) => void;
};
