# Plugins

The Kap plugin system lets you create custom share targets that appear in the editor export menu. You could for example create a plugin to share a screen recording on YouTube.

You can discover plugins or view installed ones by clicking the `Kap` menu, `Preferences…`, and selecting the `Plugins` pane.


## Getting started

A Kap plugin is an npm package that exports one or more share services. The plugin runs in the main Electron process (Node.js). That means you can use any npm package in your plugin. Kap plugins are published to npm, like any other npm package.

Take a look at existing plugins to see how they work: [`kap-giphy`](https://github.com/wulkano/kap-giphy/blob/master/index.js), [`kap-s3`](https://github.com/SamVerschueren/kap-s3), [`kap-imgur`](https://github.com/kevva/kap-imgur), [`kap-streamable`](https://github.com/kevva/kap-streamable)

Tip: You can use modern JavaScript features like async/await in your plugin.

## Requirements

- Your package must be named with the `kap-` prefix. For example `kap-giphy`.
- You must have the `kap-plugin` keyword in package.json. Add additional relevant keywords to improve discovery.
- The `"description"` in package.json should succinctly describe what you can do with it. For example: `Share GIFs on GIPHY`. Not something like this: `Kap plugin that uploads GIFs to GIPHY`.
- Use `context.setProgress()` whenever possible to keep the user updated on what's happening.
- The readme should follow the style of [`kap-giphy`](https://github.com/wulkano/kap-giphy).
- Your plugin must be tested, preferably using [`kap-plugin-test`](https://github.com/SamVerschueren/kap-plugin-test). [Example](https://github.com/wulkano/kap-giphy/blob/master/test/test.js).

## Development

When you develop a plugin it’s useful to be able to try it out in Kap. In the directory of your plugin, run `$ npm link`, go to `~/Library/Application Support/Kap/plugins` and run `$ npm link plugin-name `, and then add `"plugin-name": "latest"` to the `"dependencies"` in the package.json there. Your plugin should now be shown in Kap.

## Share service

A share service lets you add an entry to the export menu in the Kap editor window and control what happens when the user clicks it.

<img src="https://cloud.githubusercontent.com/assets/170270/26560296/8ac42740-44df-11e7-88f5-46f8483ffea1.jpg" width="1024">

```
[GIF] → |Save to Disk     |
        |Upload to Dropbox|
        |Share on GIPHY   |
```

In the above case, the second and third item are added by two different share services.

The share service is a plain object defining some metadata:

- `title`: The title used in the export menu. For example: `Share to GIPHY`
- `formats`: The file formats you support. Can be: `gif`, `mp4`, `webm`, `apng`
- `action`: The function that is run when the user clicks the menu item. Read more below.
- `config`: Definition of the config the plugins needs. Read more below.

The `config` property is optional.

Example:

```js
const action = async context => {
	// Do something

	context.notify('Notify about something');
};

const giphy = {
	title: 'Share to GIPHY',
	formats: ['gif'],
	action,
	config: {
		apiKey: {
			title: 'API key',
			type: 'string',
			minLength: 13,
			default: '',
			required: true
		}
	}
};

exports.shareServices = [giphy];
```

### Action

The `action` function is where you implement the behavior of your service. The function receives a `context` argument with some metadata and utility methods.

- `.format`: The file format the user chose in the editor window. Can be: `gif`, `mp4`, `webm`, `apng`
- `.defaultFileName`: Default file name for the recording. For example: `Kapture 2017-05-30 at 1.03.49.gif`
- `.filePath()`: Convert the screen recording to the user chosen format and return a Promise for the file path.
- `.config`: Get and set config for you plugin. It’s an instance of [`electron-store`](https://github.com/sindresorhus/electron-store#instance).
- `.request()`: Do a network request, like uploading. It’s a wrapper around [`got`](https://github.com/sindresorhus/got).
- `.copyToClipboard(text)`: Copy text to the clipboard. If you for example copy a link to the uploaded recording to the clipboard, don’t forget to `.notify()` the user about it.
- `.notify(text)`: Show a notification.
- `.setProgress(text, percentage)`: Update progress information in the Kap export window. Use this whenever you have long-running jobs, like uploading. The `percentage` should be a number between `0` and `1`.
- `.openConfigFile()`: Open the plugin config file in the user’s editor.
- `.cancel()`: Indicate that the plugin operation canceled for some reason. [Example.](https://github.com/wulkano/kap/blob/efc32d12f381615c9fcfc41065d9c2ee200e8975/app/src/main/save-file-service.js#L28-L31) This closes the Kap export window. If the cancelation was not the result of a user gesture, use `.notify()` to inform the user why it was canceled.


### Config

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
