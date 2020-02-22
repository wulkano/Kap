# Plugins

The Kap plugin system lets you create custom share targets that appear in the editor export menu. You could for example create a plugin to share a screen recording on YouTube.

You can discover plugins or view installed ones by clicking the `Kap` menu, `Preferences…`, and selecting the `Plugins` pane.

## Getting started

A Kap plugin is an npm package that exports one or more services. The plugin runs in the main Electron process (Node.js). That means you can use any npm package in your plugin. Kap plugins are published to npm, like any other npm package.

Take a look at existing plugin examples in each section to see how they work.

Tip: You can use modern JavaScript features like async/await in your plugin.

## Requirements

- Your package must be named with the `kap-` prefix. For example `kap-giphy`.
- You must have the `kap-plugin` keyword in package.json. Add additional relevant keywords to improve discovery.
- The `"description"` in package.json should succinctly describe what you can do with it. For example: `Share GIFs on GIPHY`. Not something like this: `Kap plugin that uploads GIFs to GIPHY`.
- The readme should follow the style of [`kap-giphy`](https://github.com/wulkano/kap-giphy).
- Your plugin must be tested, preferably using [`kap-plugin-test`](https://github.com/SamVerschueren/kap-plugin-test) and [`kap-plugin-mock-context`](https://github.com/samverschueren/kap-plugin-mock-context). [Example](https://github.com/wulkano/kap-giphy/blob/master/test/test.js).
- If your plugin only supports specific versions of Kap, include a `kapVersion` field in the package.json with a [semver range](https://nodesource.com/blog/semver-a-primer/).

## Development

When you develop a plugin it’s useful to be able to try it out in Kap. In the directory of your plugin, run `$ npm link`, go to `~/Library/Application Support/Kap/plugins` and run `$ npm link plugin-name `, and then add `"plugin-name": "latest"` to the `"dependencies"` in the package.json there. Your plugin should now be shown in Kap.

When Kap is built for production, it prunes dependencies at launch time. In order to avoid any issues, make sure to run `$ npm link` after launching Kap, and make sure to re-run it if you restart Kap. Alternatively, you can run Kap in dev mode by downloading the source and running `$ yarn start`.

## Services

Kap currently supports three different types of services and each plugin can have multiple of each, altough each plugin should focus on a specific area.

### Share services

A share service lets you add an entry to the export menu in the Kap editor window and control what happens when the user clicks it.

<img src="https://cloud.githubusercontent.com/assets/170270/26560296/8ac42740-44df-11e7-88f5-46f8483ffea1.jpg" width="1024">

```
| Save to Disk      |
| Upload to Dropbox |
| Share on GIPHY    |
```

In the above case, the second and third item are added by two different share services.

The share service is a plain object defining some metadata:

- `title`: The title used in the export menu. For example: `Share to GIPHY`.<br>The text should be in [title case](https://capitalizemytitle.com), for example, `Save to Disk`, not `Save to disk`.
- `configDescription`: A description displayed at the top of the configuration window. You can use this to explain the config options or link to API docs. Any links in this description will be parsed into clickable links automatically.
- `formats`: The file formats you support. Can be: `gif`, `mp4`, `webm`, `apng`
- `action`: The function that is run when the user clicks the menu item. [Read more below.](#action)
- `config`: Definition of the config the plugins needs. [Read more below](#config).

The `config` and `configDescription` properties are optional.

Example:

```js
const action = async context => {
	// Do something

	context.notify('Notify about something');
};

const config = {
  apiKey: {
    title: 'API key',
    type: 'string',
    minLength: 13,
    default: '',
    required: true
  }
};

const giphy = {
  title: 'Share to GIPHY',
  formats: [
    'gif'
  ],
  action,
  config
};

exports.shareServices = [giphy];
```

#### Action

The `action` function is where you implement the behavior of your service. The function receives a `context` argument with some metadata and utility methods.

- `.format`: The file format the user chose in the editor window. Can be: `gif`, `mp4`, `webm`, `apng`
- `.prettyFormat`: Prettified version of `.format` for use in notifications. Can be: `GIF`, `MP4`, `WebM`, `APNG`
- `.defaultFileName`: Default file name for the recording. For example: `Kapture 2017-05-30 at 1.03.49.gif`
- `.filePath()`: Convert the screen recording to the user chosen format and return a Promise for the file path.
  - If you want to overwrite the format that the user selected, you can pass a `fileType` option: `.filePath({fileType: 'mp4'})`. Can be one of `mp4`, `gif`, `apng`, `webm`. This can be useful if you, for example, need to handle the GIF conversion yourself.
- `.config`: Get and set config for you plugin. It’s an instance of [`electron-store`](https://github.com/sindresorhus/electron-store#instance).
- `.request()`: Do a network request, like uploading. It’s a wrapper around [`got`](https://github.com/sindresorhus/got).
- `.copyToClipboard(text)`: Copy text to the clipboard. If you for example copy a link to the uploaded recording to the clipboard, don’t forget to `.notify()` the user about it.
- `.notify(text, action)`: Show a notification. Optionally pass in a function that is called with the event when the notification is clicked.
- `.setProgress(text, percentage)`: Update progress information in the Kap export window. Use this whenever you have long-running jobs, like uploading. The `percentage` should be a number between `0` and `1`.
- `.openConfigFile()`: Open the plugin config file in the user’s editor.
- `.cancel()`: Indicate that the plugin operation canceled for some reason. [Example.](https://github.com/wulkano/kap/blob/efc32d12f381615c9fcfc41065d9c2ee200e8975/app/src/main/save-file-service.js#L28-L31) If the cancelation was not the result of a user gesture, use `.notify()` to inform the user why it was canceled.
- `.waitForDeepLink()`: Returns a Promise that resolves when a deep link for this plugin is opened. The link should be in the format `kap://plugins/{pluginName}/{rest}`, where `pluginName` is the npm package name and `rest` is the string the Promise will resolve with. This is useful for [OAuth flows](#oauth).

#### Notes

Use `context.setProgress()` whenever possible to keep the user updated on what's happening. The `.filePath()` method sets its own progress, so you should not do it for that step.

Example plugins: [`kap-giphy`](https://github.com/wulkano/kap-giphy/blob/master/index.js), [`kap-s3`](https://github.com/SamVerschueren/kap-s3), [`kap-imgur`](https://github.com/kevva/kap-imgur), [`kap-streamable`](https://github.com/kevva/kap-streamable)

### Edit services

Only supported in Kap versions >= 3.2.0

An edit service lets you add an entry to the edit menu in the Kap editor window and process the recording before it gets converted and exported. The edit service receives an `mp4` file which is generated from the recording after triming the duration and adjusting the size. It's expecrted to produce another `mp4` file at the given output location, which will then get passed on to the appropriate share service.

The edit service is a plain object defining some metadata:

- `title`: The title used in the export menu. For example: `Reverse`.<br>The text should be in [title case](https://capitalizemytitle.com), for example, `Slow Down`, not `Slow down`.
- `configDescription`: A description displayed at the top of the configuration window. You can use this to explain the config options or link to API docs. Any links in this description will be parsed into clickable links automatically.
- `action`: The function that is run when the user clicks the menu item. [Read more below.](#action)
- `config`: Definition of the config the plugins needs. [Read more below](#config).

The `config` and `configDescription` properties are optional.

Example:

```js
const action = async context => {
	// Do something

	context.notify('Notify about something');
};

const config = {
  percent: {
    title: 'Percent by which to slow down',
	type: 'number',
	maximum: 1,
	minimum: 0,
    default: 0.5,
    required: true
  }
};

const slowDown = {
  title: 'Slow down',
  action,
  config
};

exports.editServices = [slowDown];
```

#### Action

The `action` function is where you implement the behavior of your service. The function receives a `context` argument with some metadata and utility methods.

- `.inputPath`: The path to the input trimmed `mp4` file
- `.outputPath`: The path where the resulting `mp4` file should be by the end of the action
- `.exportOptions`: An object containing info about the recording (note that the input video has already been resized and trimmed):
	- `.width`: Width of the input file
	- `.height`: Height of the input file
	- `.format`: The selected format in which the video will be converted to later on
	- `.fps`: The selected fps that will be used for the final conversion
	- `.duration`: Duration of the trimmed input file
	- `.isMuted`: Whether the video is muted or not
	- `.loop`: Whether the resulting GIF or APNG file will be looped or not
- `.convert(args, text)`: A utility function which accepts an array of ffmpeg arguments and handles executing the command, parsing the progress, generating time estimate and showing it to the user. The second argument is optional and defaults to `Converting`. Can be something more descriptive to your service like `Reversing` and will be used for the status reporting.

Example (reversing a video):

```js
const reverseAction = async context => {
	return context.convert([
		'-i',
		context.inputPath,
		'-vf', 'reverse',
		context.outputPath
	], 'Reversing');

	// Will call ffmpeg -i {inputPath} -vf reverse {outputPath}
};
```
- `.config`: Get and set config for you plugin. It’s an instance of [`electron-store`](https://github.com/sindresorhus/electron-store#instance).
- `.request()`: Do a network request, like uploading. It’s a wrapper around [`got`](https://github.com/sindresorhus/got).
- `.copyToClipboard(text)`: Copy text to the clipboard. If you for example copy a link to the uploaded recording to the clipboard, don’t forget to `.notify()` the user about it.
- `.notify(text, action)`: Show a notification. Optionally pass in a function that is called with the event when the notification is clicked.
- `.openConfigFile()`: Open the plugin config file in the user’s editor.
- `.cancel()`: Indicate that the plugin operation canceled for some reason. [Example.](https://github.com/wulkano/kap/blob/efc32d12f381615c9fcfc41065d9c2ee200e8975/app/src/main/save-file-service.js#L28-L31) If the cancelation was not the result of a user gesture, use `.notify()` to inform the user why it was canceled.
- `.waitForDeepLink()`: Returns a Promise that resolves when a deep link for this plugin is opened. The link should be in the format `kap://plugins/{pluginName}/{rest}`, where `pluginName` is the npm package name and `rest` is the string the Promise will resolve with. This is useful for [OAuth flows](#oauth).

#### Notes

It is highly recomended that an edit service uses a [PCancelable](https://github.com/sindresorhus/p-cancelable) function as the action, so Kap can cancel it in case the user decides to cancel the export.

Example:
```js
const PCancelable = require('p-cancelable');

const action = PCancelable.fn(async (context, onCancel) => {
	const process = context.convert([
		'-i',
		context.inputPath,
		'-vf', 'reverse',
		context.outputPath
	], 'Reversing');

	onCancel(() => {
		process.cancel();
	});

	await process;
});
```

Example plugins: [`kap-playback-speed`](https://github.com/karaggeorge/kap-playback-speed), [`kap-reverse`](https://github.com/karaggeorge/kap-reverse)

### Record services

A record service lets you add an entry to the Plugins submenu of the main context menu of the cropper. A user can enable or disable the service and when enabled, the service can take action in different stages of the recording process.

Record services are different from share and edit services, since they don't have one action but many hooks.

The record service is a plain object defining some metadata and hooks:

- `title`: The title used in the export menu. For example: `Share to GIPHY`.<br>The text should be in [title case](https://capitalizemytitle.com), for example, `Save to Disk`, not `Save to disk`.
- `configDescription`: A description displayed at the top of the configuration window. You can use this to explain the config options or link to API docs. Any links in this description will be parsed into clickable links automatically.
- `config`: Definition of the config the plugins needs. [Read more below](#config).
- `willStartRecording`: Function that is called before the recording starts. [Read more below.](#hooks)
- `didStartRecording`: Function that is called after the recording starts. [Read more below.](#hooks)
- `didStopRecording`: Function that is called after the recording stops. [Read more below.](#hooks)
- `willEnable`: Function that is called when the user enables the service. [Read more below.](#hooks)

The `config`, `configDescription` and hook properties are optional.

Example:

```js
const willStartRecording = async context => {
	// Do something
	context.notify('Recording will start now!');
};

const didStopRecording = async context => {
	// Do something
	context.notify('Recording stopped!');
};

const config = {
  apiKey: {
    title: 'API key',
    type: 'string',
    minLength: 13,
    default: '',
    required: true
  }
};

const doNotDisturb = {
  title: 'Silence Notifications',
  willStartRecording,
  didStopRecording,
  config
};

exports.recordServices = [doNotDisturb];
```

#### Hooks

Each hook is called as described above. Each function can be asynchronous and will be called with a context object described below. The only hook that behaves differently is `willEnable`. This hook will be called when a service is about to be enabled (including after installing the plugin if the config is valid). The hook can be an asynchronous function and if it returns or resolves with `false`, the hook will not be enabled. 

You can use this to check if you have enough permissions for the service to work, and if not you can request the missing permissions and return `false`. This ensures that your other plugin hooks will not be called until `willEnable` returns `true`.

#### Hooks Context

The hook functions receive a `context` argument with some metadata and utility methods.

- `.state`: An plain empty object that will be shared and passed to all hooks in the same recording process. Can be useful to persist data between the different hooks.
- `.apertureOptions`: An object with the options passed to [Aperture](https://github.com/wulkano/aperture-node). The API is described [here](https://github.com/wulkano/aperture-node#options).
- `.config`: Get and set config for you plugin. It’s an instance of [`electron-store`](https://github.com/sindresorhus/electron-store#instance).
- `.request()`: Do a network request, like uploading. It’s a wrapper around [`got`](https://github.com/sindresorhus/got).
- `.copyToClipboard(text)`: Copy text to the clipboard. If you for example copy a link to the uploaded recording to the clipboard, don’t forget to `.notify()` the user about it.
- `.notify(text, action)`: Show a notification. Optionally pass in a function that is called with the event when the notification is clicked.
- `.openConfigFile()`: Open the plugin config file in the user’s editor.
- `.cancel()`: Indicate that the plugin operation canceled for some reason. [Example.](https://github.com/wulkano/kap/blob/efc32d12f381615c9fcfc41065d9c2ee200e8975/app/src/main/save-file-service.js#L28-L31) If the cancelation was not the result of a user gesture, use `.notify()` to inform the user why it was canceled.
- `.waitForDeepLink()`: Returns a Promise that resolves when a deep link for this plugin is opened. The link should be in the format `kap://plugins/{pluginName}/{rest}`, where `pluginName` is the npm package name and `rest` is the string the Promise will resolve with. This is useful for [OAuth flows](#oauth).

Example plugins: [`kap-do-not-disturb`](https://github.com/karaggeorge/kap-do-not-disturb), [`kap-hide-desktop-icons`](https://github.com/karaggeorge/kap-hide-desktop-icons)

## Config

The config system uses [JSON Schema](http://json-schema.org) which lets you describe the config your plugin supports and have it validated and enforced. For example, you can define that some config key is required, or that it should be a string with minimum length of 10. Kap will notify the user of invalid config. If you define required config, Kap will open the config file automatically on install so the user can fill out the required fields.

It’s recommended to set an empty `default` property for required config keys, so the user can just fill them out.

The `title` property must be defined for each config key. *(We’ll use it in the future to render your config directly in the UI)*

Example:

```js
config: {
	username: {
		title: 'Username',
		type: 'string',
		minLength: 5,
		default: '',
		required: true
	},
	hasUnicorn: {
		title: 'Do you have a unicorn?',
		type: 'boolean',
		default: false,
		required: true
	}
}
```

[Read more about JSON Schema](https://spacetelescope.github.io/understanding-json-schema/)

## General APIs

Every type of plugin and service can additionally export the following:
- `didInstall(config)`: A hook that will be called when the plugin is first installed.
- `didConfigChange(newValues, oldValues, config)`: A hook that will be called whenever the config of the plugin is changed.
- `willUninstall(config)`: A hook that will be called when a plugin is being uninstalled. Can be used to clean up artifacts.

In addition to these, each plugin needs to export at least one of the following:
- `shareServices`: an array of share services and described above
- `editServices`: an array of edit services and described above
- `recordServices`: an array of record services and described above

## OAuth

Sometimes services require an [OAuth](https://oauth.net/2/) flow to retrieve a token. These flows are often required to be completed in the browser and not in a webview. For this reason, Kap provides deep linking support. Follow these steps to support OAuth in your plugin:

- When the export starts, check if the `accessToken` is available (if you have already authenticated) in the plugin config. This should not be listed in the JSON Schema options mentioned above unless the user is meant to edit them.
- If it's not available, [open an external link](https://www.electronjs.org/docs/api/shell#shellopenexternalurl-options) to the OAuth provider's page with the correct parameters. Usually client ID.
- When registering the app, provide something like `kap://plugins/{pluginName}/auth` as the callback URL.
- Call `context.waitForDeepLink()` and wait for the user to go through the process.
- When the above call resolves, you'll have the remaining path, along with any extra info the API added. In the above example, it would be something like `auth?code=###`.
- You can now exchange the code for a token, and then store that in the config, so you can use it for future exports.

For an example of this flow in action, check out [kap-dropbox](https://github.com/karaggeorge/kap-dropbox).

If the API provider only allows HTTP/HTTPS URLs, or if you don't want to do the code exchange in the plugin (to avoid having the secret in the code), you might need to create a proxy, similar to the [one used for kap-dropbox](https://github.com/karaggeorge/kap-dropbox/tree/master/oauth-proxy), to trigger the deep link.

## Removing your Kap plugin

Since npm doesn't allow you to remove packages from the registery, Kap filters out deprecated packages in the plugin list.

When you are ready to retire your Kap plugin, simply run `npm deprecate kap-plugin "Deprecated"`.

[Read more about the `npm-deprecate` command](https://docs.npmjs.com/cli/deprecate)
