import {ConversionRemoteState, ConversionState} from '../common/types';
import Conversion from '../conversion';

const getConversionState = (conversion: Conversion): ConversionState => {
  return {
    title: conversion.title,
    description: conversion.description,
    message: conversion.text,
    progress: conversion.percentage,
    size: conversion.finalSize,
    status: conversion.status,
    canCopy: conversion.canCopy
  };
};

const conversionRemoteState: ConversionRemoteState = (sendUpdate: (state: ConversionState, id: string) => void) => {
  const getState = (conversionId: string) => {
    const conversion = Conversion.fromId(conversionId);

    if (!conversion) {
      return;
    }

    return getConversionState(conversion);
  };

  const subscribe = (conversionId: string) => {
    const conversion = Conversion.fromId(conversionId);

    if (!conversion) {
      return;
    }

    const callback = () => {
      sendUpdate(getConversionState(conversion), conversionId);
    };

    conversion.on('updated', callback);
    return () => {
      conversion.off('updated', callback);
    };
  };

  const actions = {
    cancel: (_: any, conversionId: string) => {
      Conversion.fromId(conversionId)?.cancel();
    },
    copy: (_: any, conversionId: string) => {
      Conversion.fromId(conversionId)?.copy();
    }
  } as any;

  return {
    subscribe,
    getState,
    actions
  };
};

export default conversionRemoteState;
export const name = 'conversion';
