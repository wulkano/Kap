import path from 'path';
import tempy from 'tempy';
import {Encoding, Format} from '../common/types';
import {track} from '../common/analytics';
import h264Converters, {crop as h264Crop} from './h264';
import {ConvertOptions} from './utils';
import {getFormatExtension} from '../common/constants';
import PCancelable, {OnCancelFunction} from 'p-cancelable';
import {convert} from './process';
import {plugins} from '../plugins';
import {EditServiceContext} from '../plugins/service-context';
import {settings} from '../common/settings';
import {Except} from 'type-fest';

const converters = new Map([
  [Encoding.h264, h264Converters]
]);

const croppingHandlers = new Map([
  [Encoding.h264, h264Crop]
]);

// eslint-disable-next-line @typescript-eslint/promise-function-async
export const convertTo = (
  format: Format,
  options: Except<ConvertOptions, 'outputPath'> & {defaultFileName: string},
  encoding: Encoding = Encoding.h264
) => {
  if (!converters.has(encoding)) {
    throw new Error(`Unsupported encoding: ${encoding}`);
  }

  const converter = converters.get(encoding)?.get(format);

  if (!converter) {
    throw new Error(`Unsupported file format for ${encoding}: ${format}`);
  }

  track(`file/export/encoding/${encoding}`);
  track(`file/export/format/${format}`);

  const conversionOptions = {
    outputPath: path.join(tempy.directory(), `${options.defaultFileName}.${getFormatExtension(format)}`),
    ...options
  };

  if (options.editService) {
    const croppingHandler = croppingHandlers.get(encoding);

    if (!croppingHandler) {
      throw new Error(`Unsupported encoding: ${encoding}`);
    }

    return convertWithEditPlugin({...conversionOptions, format, croppingHandler, converter});
  }

  return converter(conversionOptions);
};

const convertWithEditPlugin = PCancelable.fn(
  async (
    options: ConvertOptions & {
      format: Format;
      converter: (options: ConvertOptions) => PCancelable<string>;
      croppingHandler: (options: ConvertOptions) => PCancelable<string>;
    },
    onCancel: OnCancelFunction
  ) => {
    let croppedPath: string;
    let isCanceled = false;

    if (options.shouldCrop) {
      croppedPath = tempy.file({extension: path.extname(options.inputPath)});

      options.onProgress('Cropping', 0);

      const cropProcess = options.croppingHandler({
        ...options,
        outputPath: croppedPath
      });

      onCancel(() => {
        isCanceled = true;
        cropProcess.cancel();
      });

      await cropProcess;

      if (isCanceled) {
        return '';
      }
    } else {
      croppedPath = options.inputPath;
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const convertFunction = (args: string[], text = 'Converting') => new PCancelable<void>(async (resolve, reject, onCancel) => {
      try {
        const process = convert(
          '', {
            shouldTrack: false,
            startTime: options.startTime,
            endTime: options.endTime,
            onProgress: (progress, estimate) => {
              options.onProgress(text, progress, estimate);
            }
          }, args
        );

        onCancel(() => {
          process.cancel();
        });
        await process;
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    const editPath = tempy.file({extension: path.extname(croppedPath)});

    const editPlugin = plugins.editPlugins.find(plugin => {
      return plugin.name === options.editService?.pluginName;
    });

    const editService = editPlugin?.editServices.find(service => {
      return service.title === options.editService?.serviceTitle;
    });

    if (!editService || !editPlugin) {
      throw new Error(`Edit service ${options.editService?.serviceTitle} not found`);
    }

    const editProcess = editService.action(
      new EditServiceContext({
        plugin: editPlugin,
        onCancel: options.onCancel,
        onProgress: options.onProgress,
        convert: convertFunction,
        inputPath: croppedPath,
        outputPath: editPath,
        exportOptions: {
          width: options.width,
          height: options.height,
          format: options.format,
          fps: options.fps,
          duration: options.endTime - options.startTime,
          isMuted: options.shouldMute,
          loop: settings.get('loopExports')
        }
      })
    );

    onCancel(() => {
      isCanceled = true;
      // @ts-expect-error
      if (editProcess.cancel && typeof editProcess.cancel === 'function') {
        (editProcess as PCancelable<void>).cancel();
      }
    });

    await editProcess;

    if (isCanceled) {
      return '';
    }

    track(`plugins/used/edit/${options.editService?.pluginName}`);

    const conversionProcess = options.converter({
      ...options,
      shouldCrop: false,
      inputPath: editPath
    });

    onCancel(() => {
      conversionProcess.cancel();
    });

    return conversionProcess;
  }
);
