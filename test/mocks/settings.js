'use strict';
const sinon = require('sinon');

const mocks = {};

const mockGet = sinon.fake((key, defaultValue) => {
  return mocks[key] || defaultValue;
});

module.exports = {
  get: mockGet,
  set: sinon.fake(),
  delete: sinon.fake(),
  setMock: (key, value) => {
    mocks[key] = value;
  }
};
