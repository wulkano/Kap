import moduleAlias from 'module-alias';
import path from 'path';
import fs from 'fs';

export const mockModule = (name: string) => {
  const mockModulePathTypescript = path.resolve(__dirname, '..', 'mocks', `${name}.ts`);
  const mockModulePath = path.resolve(__dirname, '..', 'mocks', `${name}.js`);

  const mockPath = [
    mockModulePathTypescript,
    mockModulePath
  ].find(p => fs.existsSync(p));

  if (!mockPath) {
    throw new Error(`Missing mock implementation at ${mockModulePath}`.replace('js', '(ts|js)'));
  }

  moduleAlias.addAlias(name, mockPath);
  return require(mockPath);
};

export const mockImport = (importPath: string, mock: string) => {
  const mockModulePathTypescript = path.resolve(__dirname, '..', 'mocks', `${mock}.ts`);
  const mockModulePath = path.resolve(__dirname, '..', 'mocks', `${mock}.js`);

  const mockPath = [
    mockModulePathTypescript,
    mockModulePath
  ].find(p => fs.existsSync(p));

  if (!mockPath) {
    throw new Error(`Missing mock implementation at ${mockModulePath}`.replace('js', '(ts|js)'));
  }

  moduleAlias.addAlias(importPath, mockPath);
  return require(mockPath);
};
