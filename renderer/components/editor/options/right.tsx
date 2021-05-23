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

// Import electron from 'electron';
// import React from 'react';
// import PropTypes from 'prop-types';

// import {connect, EditorContainer} from '../../../containers';
// import Select from './select';
// import {GearIcon} from '../../../vectors';

// class RightOptions extends React.Component {
//   render() {
//     const {
//       options,
//       format,
//       plugin,
//       selectFormat,
//       selectPlugin,
//       startExport,
//       openWithApp,
//       selectOpenWithApp,
//       selectEditPlugin,
//       editOptions,
//       editPlugin,
//       openEditPluginConfig
//     } = this.props;

//     const formatOptions = options ? options.map(({format, prettyFormat}) => ({value: format, label: prettyFormat})) : [];
//     const pluginOptions = options ? options.find(option => option.format === format).plugins.map(plugin => {
//       if (plugin.apps) {
//         const submenu = plugin.apps.map(app => ({
//           label: app.isDefault ? `${app.name} (default)` : app.name,
//           type: 'radio',
//           checked: openWithApp && app.url === openWithApp.url,
//           click: () => selectOpenWithApp(app),
//           icon: electron.remote.nativeImage.createFromDataURL(app.icon).resize({width: 16, height: 16})
//         }));

//         if (plugin.apps[0].isDefault) {
//           submenu.splice(1, 0, {type: 'separator'});
//         }

//         return {
//           isBuiltIn: false,
//           submenu,
//           value: plugin.title,
//           label: openWithApp ? openWithApp.name : ''
//         };
//       }

//       return {
//         type: openWithApp ? 'normal' : 'radio',
//         value: plugin.title,
//         label: plugin.title,
//         isBuiltIn: plugin.pluginName.startsWith('_')
//       };
//     }) : [];

//     if (pluginOptions.every(opt => opt.isBuiltIn)) {
//       pluginOptions.push({
//         separator: true
//       }, {
//         type: 'normal',
//         label: 'Get Plugins…',
//         value: 'open-plugins'
//       });
//     }

//     const editPluginOptions = editOptions && editOptions.map(option => ({label: option.title, value: option}));
//     const buttonAction = editPlugin ? openEditPluginConfig : () => selectEditPlugin(editOptions[0]);

// return (
//   <div className="container">
//     {
//       editPluginOptions && editPluginOptions.length > 0 && (
//         <>
//           {
//             (!editPlugin || editPlugin.hasConfig) && (
//               <button key={editPlugin} type="button" className="add-edit-plugin" onClick={buttonAction}>
//                 {editPlugin ? <GearIcon fill="#fff" hoverFill="#fff" size="12px"/> : '+'}
//               </button>
//             )
//           }
//           {
//             editPlugin && (
//               <div className="edit-plugin">
//                 <Select clearable options={editPluginOptions} selected={editPlugin} onChange={selectEditPlugin}/>
//               </div>
//             )
//           }
//         </>
//       )
//     }
//     <div className="format">
//       <Select options={formatOptions} selected={format} onChange={selectFormat}/>
//     </div>
//     <div className="plugin">
//       <Select options={pluginOptions} selected={plugin} onChange={selectPlugin}/>
//     </div>
//     <button type="button" className="start-export" onClick={startExport}>Export</button>
//     <style jsx>{`
//       .container {
//         height: 100%;
//         display: flex;
//         align-items: center;
//       }

//       .label {
//         font-size: 12px;
//         margin-right: 8px;
//         color: white;
//       }

//       .format {
//         height: 24px;
//         width: 96px;
//         margin-right: 8px;
//       }

//       .edit-plugin {
//         height: 24px;
//         margin-right: 8px;
//         width: 128px;
//       }

// .plugin {
//   height: 24px;
//   width: 128px;
//   margin-right: 8px;
// }

//       button {
//         padding: 4px 8px;
//         background: rgba(255, 255, 255, 0.1);
//         font-size: 12px;
//         line-height: 12px;
//         color: white;
//         height: 24px;
//         border-radius: 4px;
//         text-align: center;
//         border: none;
//         box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
//       }

//       button:hover,
//       button:focus {
//         background: hsla(0, 0%, 100%, 0.2);
//         outline: none;
//       }

//       .start-export {
//         width: 72px;
//       }

//       .add-edit-plugin {
//         width: max-content;
//         margin-right: 8px;
//       }
//     `}</style>
//   </div>
// );
//   }
// }

// RightOptions.propTypes = {
//   options: PropTypes.arrayOf(PropTypes.object),
//   format: PropTypes.string,
//   plugin: PropTypes.string,
//   selectFormat: PropTypes.elementType,
//   selectPlugin: PropTypes.elementType,
//   startExport: PropTypes.elementType,
//   openWithApp: PropTypes.object,
//   selectOpenWithApp: PropTypes.elementType,
//   editPlugin: PropTypes.object,
//   editOptions: PropTypes.arrayOf(PropTypes.object),
//   selectEditPlugin: PropTypes.elementType,
//   openEditPluginConfig: PropTypes.elementType
// };

// export default connect(
//   [EditorContainer],
//   ({options, format, plugin, openWithApp, editOptions, editPlugin}) => ({options, format, plugin, openWithApp, editOptions, editPlugin}),
//   ({selectFormat, selectPlugin, startExport, selectOpenWithApp, selectEditPlugin, openEditPluginConfig}) => ({selectFormat, selectPlugin, startExport, selectOpenWithApp, selectEditPlugin, openEditPluginConfig})
// )(RightOptions);
