const sinon = require('sinon');

let dialogState;
let dialogResolve;
let waitForDialogResolve;

const showDialogFake = sinon.fake(async options => new Promise(resolve => {
  dialogState = options;
  dialogResolve = resolve;

  if (waitForDialogResolve) {
    waitForDialogResolve(options);
  }

  waitForDialogResolve = undefined;
}));

const resolve = result => {
  if (dialogResolve) {
    dialogResolve(result);
  }

  dialogResolve = undefined;
  dialogState = undefined;
};

const fakeAction = async index => {
  const button = dialogState.buttons[index];
  const action = button && button.action;
  let wasCalled = false;

  if (action) {
    await action(resolve, newState => {
      wasCalled = true;
      dialogState = newState;
    });

    if (!wasCalled) {
      resolve(index);
    }
  } else {
    resolve(index);
  }
};

const getCurrentState = () => dialogState;

const waitForDialog = () => new Promise(resolve => {
  waitForDialogResolve = resolve;
});

module.exports = {
  showDialog: showDialogFake,
  fakeAction,
  resolve,
  getCurrentState,
  waitForDialog
};
