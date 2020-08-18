import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {ipcRenderer as ipc} from 'electron-better-ipc';

const ArgsContext = createContext<any>(undefined);

export const WindowArgsProvider = (props: {children: ReactNode}) => {
  const [args, setArgs] = useState();

  useEffect(() => {
    return ipc.answerMain('kap-window-args', (newArgs: any) => {
      setArgs(newArgs);
    });
  }, []);

  return (
    <ArgsContext.Provider value={args}>
      {props.children}
    </ArgsContext.Provider>
  );
};

const useWindowArgs = () => useContext(ArgsContext);

export default useWindowArgs;
