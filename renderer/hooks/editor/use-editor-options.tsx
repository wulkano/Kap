import {EditorOptionsRemoteState} from 'common/types';
import createRemoteStateHook from 'hooks/use-remote-state';

const useEditorOptions = createRemoteStateHook<EditorOptionsRemoteState>('editor-options', {
  formats: [],
  editServices: [],
  fpsHistory: {
    gif: 60,
    mp4: 60,
    av1: 60,
    webm: 60,
    apng: 60,
    hevc: 60
  }
});

export type EditorOptionsState = ReturnType<typeof useEditorOptions>['state'];
export default useEditorOptions;
