import React from 'react';
import {Container} from 'unstated-next';

type ContainerOrWithInitialState<T = any> = Container<any, T> | [Container<any, T>, T];

const combineUnstatedContainers = (containers: ContainerOrWithInitialState[]) => ({children}: React.PropsWithChildren<{}>) => {
  return containers.reduce(
    (tree, ContainerOrWithInitialState) => {
      if (Array.isArray(ContainerOrWithInitialState)) {
        const [Container, initialState] = ContainerOrWithInitialState;
        return <Container.Provider initialState={initialState}>{tree}</Container.Provider>
      } else {
        return <ContainerOrWithInitialState.Provider>{tree}</ContainerOrWithInitialState.Provider>
      }
    },
    children as React.ReactElement
  );
};

export default combineUnstatedContainers;
