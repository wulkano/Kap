import Store from 'electron-store';

export const flags = new Store<{
  backgroundEditorConversion: boolean;
}>({
  name: 'flags',
  defaults: {
    backgroundEditorConversion: false
  }
});
