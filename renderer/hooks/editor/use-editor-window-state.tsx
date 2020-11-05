import useWindowState from 'hooks/window-state';

interface EditorWindowState {
  fps: number;
  filePath: string;
  originalFilePath: string;
  isNewRecording: boolean;
  recordingName: string;
  title: string;
  conversionId?: string;
}

const useEditorWindowState = () => useWindowState<EditorWindowState>();
export default useEditorWindowState;
