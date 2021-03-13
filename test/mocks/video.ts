import sinon from 'sinon';

const mocks = {
  open: sinon.fake(),
  constructor: sinon.fake(),
  getOrCreate: sinon.fake(() => new Video())
};

export default class Video {
  static getOrCreate = mocks.getOrCreate;
  openEditorWindow = mocks.open;

  constructor(...args: any[]) {
    mocks.constructor(...args);
  }

  static mocks = mocks;
}
