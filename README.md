<p align="center">
  <img src="https://getkap.co/static/favicon/kap.svg" height="64">
  <h3 align="center">Kap</h3>
  <p align="center">An open-source screen recorder built with web technology<p>
  <p align="center"><a href="https://circleci.com/gh/wulkano/kap"><img src="https://circleci.com/gh/wulkano/Kap.svg?style=shield" alt="Build Status"></a> <a href="https://github.com/sindresorhus/xo"><img src="https://img.shields.io/badge/code_style-XO-5ed9c7.svg" alt="XO code style"></a></p>
</p>

[![SWUbanner](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://vshymanskyy.github.io/StandWithUkraine/)

## Get Kap

Download the latest release:

- [Apple silicon](https://getkap.co/api/download/arm64)
- [Intel](https://getkap.co/api/download/x64)

Or install with [Homebrew-Cask](https://caskroom.github.io):

```sh
brew install --cask kap
```

## How To Use Kap

Click the menu bar icon to bring up the screen recorder. After selecting what portion of the screen you'd like to record, hit the record button to start recording. Click the menu bar icon again to stop the recording.

> Tip: While recording, Option-click the menu bar icon to pause or right-click for more options.

## Contribute

Read the [contribution guide](contributing.md).

## Plugins

For more info on how to create plugins, read the [plugins docs](docs/plugins.md).

## Troubleshooting

### Screen Recording permission loop on macOS

If Kap keeps asking for Screen Recording permissions even after you've enabled them, try this workaround from the community thread in [#1120](https://github.com/wulkano/Kap/issues/1120):

1. Quit Kap completely (Activity Monitor can help ensure no Kap process is still running).
2. Open **System Settings** (or **System Preferences**) → **Privacy & Security** → **Screen Recording**.
3. Remove Kap from the allowed apps list.
4. Reinstall Kap.
5. Launch Kap and grant Screen Recording permission again when prompted.

For several users this clears stale permission state and resolves the prompt loop.

## Dev builds

Download [`main`](https://kap-artifacts.now.sh/main) or builds for any other branch using: `https://kap-artifacts.now.sh/<branch>`. Note that these builds are unsupported and may have issues.

## Related Repositories

- [Website](https://github.com/wulkano/kap-website)
- [Aperture](https://github.com/wulkano/aperture)

## Newsletter

[Subscribe](http://eepurl.com/ch90_1)

## Thanks

- [▲ Vercel](https://vercel.com/) for fast deployments served from the edge, hosting our website, downloads, and updates.
- [● CircleCI](https://circleci.com/) for supporting the open source community and making our builds fast and reliable.
- [△ Sentry](https://sentry.io/) for letting us know when Kap isn't behaving and helping us eradicate said behaviour.
- Our [contributors](https://github.com/wulkano/kap/contributors) who help maintain Kap and make screen recording and sharing easy.
