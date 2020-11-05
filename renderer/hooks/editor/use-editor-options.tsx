import {EditorOptions} from 'common/remote-state-types';
import useRemoteState from 'hooks/use-remote-state';

const useEditorOptions = useRemoteState<EditorOptions>('editor-options', {
  formats: [],
  editServices: [],
  fpsHistory: {
    gif: 60,
    mp4: 60,
    av1: 60,
    webm: 60,
    apng: 60
  }
});

export type EditorOptionsState = ReturnType<typeof useEditorOptions>["state"];
export default useEditorOptions;
