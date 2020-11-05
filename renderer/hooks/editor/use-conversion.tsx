import {CreateConversionOptions} from 'common/types';
import {ipcRenderer} from 'electron-better-ipc';
import {createContext, PropsWithChildren, useContext, useEffect, useState} from 'react';

const ConversionContext = createContext<{
  conversionId: string;
  setConversionId: (id: string) => void;
  startConversion: (options: CreateConversionOptions) => Promise<void>
}>(undefined);

export const ConversionContextProvider = (props: PropsWithChildren<{}>) => {
  const [conversionId, setConversionId] = useState<string>();

  const startConversion = async (options: CreateConversionOptions) => {
    console.log('HERE with', options);
    const id = await ipcRenderer.callMain<CreateConversionOptions, string>('create-conversion', options);
    console.log('Got back', id);
    setConversionId(id);
  };

  const value = {
    conversionId,
    setConversionId,
    startConversion
  };

  return (
    <ConversionContext.Provider value={value}>
      {props.children}
    </ConversionContext.Provider>
  );
};

const useConversionContext = () => useContext(ConversionContext);

export default useConversionContext;
