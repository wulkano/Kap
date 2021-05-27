import Store from 'electron-store';

export const flags = new Store<{
  backgroundEditorConversion: boolean;
  editorDragTooltip: boolean;
}>({
  name: 'flags',
  defaults: {
    backgroundEditorConversion: false,
    editorDragTooltip: false
  }
});
