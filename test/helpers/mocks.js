const moduleAlias = require('module-alias');

const path = require('path');
const fs = require('fs');

module.exports.mockModule = name => {
  const mockModulePath = path.resolve(__dirname, '..', 'mocks', `${name}.js`);
  if (!fs.existsSync(mockModulePath)) {
    throw new Error(`Missing mock implementation of ${name} at ${mockModulePath}`);
  }

  moduleAlias.addAlias(name, mockModulePath);
};

module.exports.mockImport = (importPath, mock) => {
  const mockModulePath = path.resolve(__dirname, '..', 'mocks', `${mock}.js`);
  if (!fs.existsSync(mockModulePath)) {
    throw new Error(`Missing mock implementation at ${mockModulePath}`);
  }

  moduleAlias.addAlias(importPath, mockModulePath);
};
