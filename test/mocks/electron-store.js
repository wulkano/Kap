const sinon = require('sinon');

const mocks = {};

const getMock = sinon.fake((key, defaultValue) => mocks[key] || defaultValue);
const setMock = sinon.fake();
const deleteMock = sinon.fake();

module.exports = class Store {
  get = getMock;
  set = setMock;
  delete = deleteMock;

  mockGet = (key, result) => {
    mocks[key] = result;
  }

  clearMocks = () => {
    for (const key of Object.keys(mocks)) {
      delete mocks[key];
    }
  }
};
