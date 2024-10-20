import {GearIcon} from '../../../vectors';
import OptionsContainer from '../options-container';
import Select from './select';
import {ipcRenderer as ipc} from 'electron-better-ipc';
import useConversionIdContext from 'hooks/editor/use-conversion-id';
import useEditorWindowState from 'hooks/editor/use-editor-window-state';
import VideoTimeContainer from '../video-time-container';
import VideoControlsContainer from '../video-controls-container';
import useSharePlugins from 'hooks/editor/use-share-plugins';
import useEditorOptions from 'hooks/editor/use-editor-options';

const FormatSelect = () => {
  const {formats, format, updateFormat} = OptionsContainer.useContainer();
  const options = formats.map(format => ({label: format.prettyFormat, value: format.format}));

  return <Select options={options} value={format} onChange={updateFormat}/>;
};

const PluginsSelect = () => {
  const {menuOptions, label, onChange} = useSharePlugins();
  return <Select options={menuOptions} customLabel={label} onChange={onChange}/>;
};

const EditPluginsControl = () => {
  const {editServices, editPlugin, setEditPlugin} = OptionsContainer.useContainer();

  if (editServices?.length === 0) {
    return null;
  }

  if (!editPlugin) {
    return (
      <button
        type="button" className="add-edit-plugin" onClick={() => {
          setEditPlugin(editServices[0]);
        }}
      >
        +
        <style jsx>{`
          button {
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.1);
            font-size: 12px;
            line-height: 12px;
            color: white;
            height: 24px;
            border-radius: 4px;
            text-align: center;
            border: none;
            box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
          }

          button:hover,
          button:focus {
            background: hsla(0, 0%, 100%, 0.2);
            outline: none;
          }

          .add-edit-plugin {
            width: max-content;
            margin-right: 8px;
          }
        `}</style>
      </button>
    );
  }

  const openEditPluginConfig = () => {
    ipc.callMain('open-edit-config', {
      pluginName: editPlugin.pluginName,
      serviceTitle: editPlugin.title
    });
  };

  const options = editServices.map(service => ({label: service.title, value: service}));

  return (
    <>
      {
        editPlugin.hasConfig && (
          <button type="button" className="add-edit-plugin" onClick={openEditPluginConfig}>
            <GearIcon fill="#fff" hoverFill="#fff" size="12px"/>
          </button>
        )
      }
      <div className="edit-plugin">
        <Select clearable options={options} value={editPlugin} onChange={setEditPlugin}/>
      </div>
      <style jsx>{`
        button {
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.1);
          font-size: 12px;
          line-height: 12px;
          color: white;
          height: 24px;
          border-radius: 4px;
          text-align: center;
          border: none;
          box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
        }

        button:hover,
        button:focus {
          background: hsla(0, 0%, 100%, 0.2);
          outline: none;
        }

        .add-edit-plugin {
          width: max-content;
          margin-right: 8px;
        }

        .edit-plugin {
          height: 24px;
          margin-right: 8px;
          width: 128px;
        }
      `}</style>
    </>
  );
};

const ConvertButton = () => {
  const {startConversion} = useConversionIdContext();
  const options = OptionsContainer.useContainer();
  const {filePath} = useEditorWindowState();
  const {startTime, endTime} = VideoTimeContainer.useContainer();
  const {isMuted} = VideoControlsContainer.useContainer();
  const {updatePluginUsage} = useEditorOptions();

  const onClick = () => {
    const shouldCrop = true;
    startConversion({
      filePath,
      conversionOptions: {
        width: options.width,
        height: options.height,
        startTime,
        endTime,
        fps: options.fps,
        shouldMute: isMuted,
        shouldCrop,
        editService: options.editPlugin ? {
          pluginName: options.editPlugin.pluginName,
          serviceTitle: options.editPlugin.title
        } : undefined
      },
      format: options.format,
      plugins: {
        share: options.sharePlugin
      }
    });

    updatePluginUsage({
      format: options.format,
      plugin: options.sharePlugin.pluginName
    });
  };

  return (
    <button type="button" className="start-export" onClick={onClick}>
      Convert
      <style jsx>{`
        button {
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.1);
          font-size: 12px;
          line-height: 12px;
          color: white;
          height: 24px;
          border-radius: 4px;
          text-align: center;
          border: none;
          box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
        }

        button:hover,
        button:focus {
          background: hsla(0, 0%, 100%, 0.2);
          outline: none;
        }

        .start-export {
          width: 72px;
        }
      `}</style>
    </button>
  );
};

const RightOptions = () => {
  return (
    <div className="container">
      <EditPluginsControl/>
      <div className="format"><FormatSelect/></div>
      <div className="plugin"><PluginsSelect/></div>
      <ConvertButton/>
      <style jsx>{`
          .container {
            height: 100%;
            display: flex;
            align-items: center;
          }

          .label {
            font-size: 12px;
            margin-right: 8px;
            color: white;
          }

          .format {
            height: 24px;
            width: 112px;
            margin-right: 8px;
          }

          .plugin {
            height: 24px;
            width: 128px;
            margin-right: 8px;
          }
        `}</style>
    </div>
  );
};

export default RightOptions;
