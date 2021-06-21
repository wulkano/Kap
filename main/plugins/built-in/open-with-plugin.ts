import {ShareServiceContext} from '../service-context';
import path from 'path';
import {getFormatExtension} from '../../common/constants';
import {Format} from '../../common/types';

const {getAppsThatOpenExtension, openFileWithApp} = require('mac-open-with');

const action = async (context: ShareServiceContext & {appUrl: string}) => {
  const filePath = await context.filePath();
  openFileWithApp(filePath, context.appUrl);
};

export interface App {
  url: string;
  isDefault: boolean;
  icon: string;
  name: string;
}

const getAppsForFormat = (format: Format) => {
  return (getAppsThatOpenExtension.sync(getFormatExtension(format)) as App[])
    .map(app => ({...app, name: decodeURI(path.parse(app.url).name)}))
    .filter(app => !['Kap', 'Kap Beta'].includes(app.name))
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) {
        return Number(b.isDefault) - Number(a.isDefault);
      }

      return Number(b.name === 'Gifski') - Number(a.name === 'Gifski');
    });
};

const appsForFormat = (['mp4', 'gif', 'apng', 'webm', 'av1', 'hevc'] as Format[])
  .map(format => ({
    format,
    apps: getAppsForFormat(format)
  }))
  .filter(({apps}) => apps.length > 0);

export const apps = new Map(appsForFormat.map(({format, apps}) => [format, apps]));

export const shareServices = [{
  title: 'Open With',
  formats: [...apps.keys()],
  action
}];
