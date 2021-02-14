import sinon from 'sinon';

const mocks: Record<string, any> = {};
const store: Record<string, any> = {};

const getMock = sinon.fake(
  (key: string, defaultValue: any) => mocks[key] ?? store[key] ?? defaultValue
);

const setMock = sinon.fake(
  (key: string, value: any) => {
    store[key] = value;
  }
);

const deleteMock = sinon.fake(
  (key: string) => {
    delete store[key];
  }
);

const clearMock = sinon.fake(
  () => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  }
);

export default class Store {
  get = getMock;
  set = setMock;
  delete = deleteMock;
  clear = clearMock;

  get store() {
    return {
      ...store,
      ...mocks
    };
  }

  static mockGet = (key: string, result: any) => {
    mocks[key] = result;
  };

  static clearMocks = () => {
    for (const key of Object.keys(mocks)) {
      delete mocks[key];
    }
  };

  static mocks = {
    get: getMock,
    set: setMock,
    delete: deleteMock,
    clear: clearMock
  };
}
