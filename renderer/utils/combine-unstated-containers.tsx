import React, {FunctionComponent, PropsWithChildren} from 'react';
import {Container} from 'unstated-next';

type ContainerOrWithInitialState<T = any> = Container<any, T> | [Container<any, T>, T];

const combineUnstatedContainers = (containers: ContainerOrWithInitialState[]) => ({children}: PropsWithChildren<Record<string, unknown>>) => {
  // eslint-disable-next-line unicorn/no-array-reduce
  return containers.reduce<React.ReactElement>(
    (tree, ContainerOrWithInitialState) => {
      if (Array.isArray(ContainerOrWithInitialState)) {
        const [Container, initialState] = ContainerOrWithInitialState;
        return <Container.Provider initialState={initialState}>{tree}</Container.Provider>;
      }

      return <ContainerOrWithInitialState.Provider>{tree}</ContainerOrWithInitialState.Provider>;
    },
    // @ts-expect-error
    children
  );
};

export default combineUnstatedContainers;
