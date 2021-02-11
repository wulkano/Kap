import {ConversionRemoteState, ConversionState} from '../common/types';
import Conversion from '../conversion'

const getConversionState = (conversion: Conversion): ConversionState => {
  console.log(conversion);

  return {
    title: conversion.title,
    description: conversion.description,
    message: conversion.text,
    progress: conversion.percentage,
    size: conversion.finalSize,
    status: conversion.status,
    canCopy: conversion.canCopy
  };
}

const conversionRemoteState: ConversionRemoteState = (sendUpdate: (state: ConversionState, id: string) => void) => {
  const getState = (conversionId: string) => {
    console.log('Conversion', conversionId, 'requested');
    const conversion = Conversion.fromId(conversionId);

    if (!conversion) {
      return;
    }

    return getConversionState(conversion);
  }

  const subscribe = (conversionId: string) => {
    const conversion = Conversion.fromId(conversionId);

    if (!conversion) {
      return;
    }

    const callback = () => sendUpdate(getConversionState(conversion), conversionId);

    conversion.on('updated', callback);
    return () => {
      console.log('Unsubscribing');
      conversion.off('updated', callback);
    };
  };

  const actions = {
    cancel: (_: any, conversionId: string) => {
      console.log('Getting conversion', conversionId);
      Conversion.fromId(conversionId)?.cancel();
      console.log(Conversion.fromId(conversionId));
    },
    copy: (_: any, conversionId: string) => {
      console.log('GETTING COPY CALL', conversionId);
      Conversion.fromId(conversionId)?.copy();
    }
  } as any

  return {
    subscribe,
    getState,
    actions
  };
}

export default conversionRemoteState;
export const name = 'conversion';
