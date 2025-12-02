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
  has = sinon.fake((key: string) => key in mocks || key in store);
  delete = deleteMock;

  constructor(private readonly options?: any) {
    this.initDefaults();
  }

  private initDefaults() {
    if (this.options?.schema) {
      for (const [key, value] of Object.entries(this.options.schema)) {
        if ((value as any).default !== undefined) {
          store[key] = (value as any).default;
        }
      }
    }
  }

  clear = () => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }

    this.initDefaults();
  };

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
