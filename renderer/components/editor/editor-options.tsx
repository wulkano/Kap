import {useRemoteState} from '../../../main/common/remote-state';

const useEditorOptions = useRemoteState('editor-options', {formats: [], editServices: [], fpsHistory: {}});

export default useEditorOptions;
