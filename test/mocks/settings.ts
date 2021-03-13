import sinon from 'sinon';

const mocks: Record<string, any> = {};

const mockGet = sinon.fake((key: string, defaultValue: any) => mocks[key] || defaultValue);

export const settings = {
  get: mockGet,
  set: sinon.fake(),
  delete: sinon.fake(),
  setMock: (key: string, value: any) => {
    mocks[key] = value;
  }
};
