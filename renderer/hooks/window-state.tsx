import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {ipcRenderer as ipc} from 'electron-better-ipc';

const WindowStateContext = createContext<any>(undefined);

export const WindowStateProvider = (props: {children: ReactNode}) => {
  const [windowState, setWindowState] = useState();

  useEffect(() => {
    return ipc.answerMain('kap-window-state', (newState: any) => {
      setWindowState(newState);
    });
  }, []);

  return (
    <WindowStateContext.Provider value={windowState}>
      {props.children}
    </WindowStateContext.Provider>
  );
};

const useWindowState = <T extends any>() => useContext<T>(WindowStateContext);

export default useWindowState;
