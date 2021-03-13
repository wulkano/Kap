import sinon from 'sinon';

let dialogState: any;
let dialogResolve: any;
let waitForDialogResolve: any;

export const showDialog = sinon.fake(async (options: any) => new Promise(resolve => {
  dialogState = options;
  dialogResolve = resolve;

  if (waitForDialogResolve) {
    waitForDialogResolve(options);
  }

  waitForDialogResolve = undefined;
}));

const resolve = (result: any) => {
  if (dialogResolve) {
    dialogResolve(result);
  }

  dialogResolve = undefined;
  dialogState = undefined;
};

export const fakeAction = async (index: any) => {
  const button = dialogState.buttons[index];
  const action = button?.action;
  let wasCalled = false;

  if (action) {
    await action(resolve, (newState: any) => {
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

export const getCurrentState = () => dialogState;

export const waitForDialog = async () => new Promise<any>(resolve => {
  waitForDialogResolve = resolve;
});
