import {CreateConversionOptions} from 'common/types';
import {ipcRenderer} from 'electron-better-ipc';
import {createContext, PropsWithChildren, useContext, useState} from 'react';

const ConversionIdContext = createContext<{
  conversionId: string;
  setConversionId: (id: string) => void;
  startConversion: (options: CreateConversionOptions) => Promise<void>;
}>(undefined);

let savedConversionId: string;

export const ConversionIdContextProvider = (props: PropsWithChildren<Record<string, unknown>>) => {
  const [conversionId, setConversionId] = useState<string>();

  const startConversion = async (options: CreateConversionOptions) => {
    const id = await ipcRenderer.callMain<CreateConversionOptions, string>('create-conversion', options);
    setConversionId(id);
  };

  const setConvId = (id: string) => {
    savedConversionId = savedConversionId || id;
    setConversionId(id || savedConversionId);
  };

  const value = {
    conversionId,
    setConversionId: setConvId,
    startConversion
  };

  return (
    <ConversionIdContext.Provider value={value}>
      {props.children}
    </ConversionIdContext.Provider>
  );
};

const useConversionIdContext = () => useContext(ConversionIdContext);

export default useConversionIdContext;
