import {ConversionRemoteState} from 'common/types';
import createRemoteStateHook from 'hooks/use-remote-state';

const useConversion = createRemoteStateHook<ConversionRemoteState>('conversion');

export type UseConversion = ReturnType<typeof useConversion>;
export type UseConversionState = UseConversion['state'];
export default useConversion;
