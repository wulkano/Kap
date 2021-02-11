import {ConversionRemoteState} from 'common/types';
import useRemoteState from 'hooks/use-remote-state';

const useConversion = useRemoteState<ConversionRemoteState>('conversion');

export type UseConversion = ReturnType<typeof useConversion>;
export type UseConversionState = UseConversion["state"];
export default useConversion;
