import useWindowState from 'hooks/window-state';
import {EditorWindowState} from 'common/types';

const useEditorWindowState = () => useWindowState<EditorWindowState>();
export default useEditorWindowState;
