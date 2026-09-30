# Native helpers

`mac-open-with`, `mac-windows`, `macos-audio-devices`, and `node-mac-app-icon` publish their Swift helpers only as Intel (`x86_64`) binaries. On Apple silicon Macs without Rosetta they fail with `EBADARCH` ("bad CPU type in executable"), which breaks the "Open with" menu, window selection, audio device selection, and app icons in the window picker.

This directory contains the helpers' sources, copied unchanged from the commits that match the published versions Kap uses. On `postinstall`, `build/build-native-helpers.js` builds an `arm64` slice of each helper and combines it with the published `x86_64` slice into a universal binary in `node_modules`. Intel Macs keep running exactly the binary they always have. Building needs Swift from Xcode or the Command Line Tools.

The `arm64` slice's minimum macOS version comes from the toolchain that builds it. Apple silicon Macs start at macOS 11, but Xcode 27 can't target anything older than macOS 12, so build releases with Xcode 26 or earlier (CI uses Xcode 13.4.1). The install prints a warning when that's not the case.

| Directory | Replaces | Source |
| --- | --- | --- |
| `open-with` | `mac-open-with@1.2.3` `open-with` | [karaggeorge/mac-open-with@f698f19](https://github.com/karaggeorge/mac-open-with/tree/f698f1948ce8745d5ac42dabdf9cd61d3e730d96) |
| `mac-windows` | `mac-windows@1.0.0` `scripts/MacWindows` | [karaggeorge/mac-windows@3a48eef](https://github.com/karaggeorge/mac-windows/tree/3a48eef64e1a99f136c03942923b8768eed6b01c/swift/MacWindows) |
| `activate-window` | `mac-windows@1.0.0` `scripts/ActivateWindow` | [karaggeorge/mac-windows@3a48eef](https://github.com/karaggeorge/mac-windows/tree/3a48eef64e1a99f136c03942923b8768eed6b01c/swift/ActivateWindow) |
| `audio-devices` | `macos-audio-devices@1.4.0` `audio-devices` | [karaggeorge/macos-audio-devices@5b5db17](https://github.com/karaggeorge/macos-audio-devices/tree/5b5db178bc01a019fb4865bae083a0b9b4fdb0d4) |
| `get-app-icon` | `node-mac-app-icon@1.4.0` `run` | [sallar/GetAppIcon@d68dd0b](https://github.com/sallar/GetAppIcon/tree/d68dd0bb2e4f3794dc013a1f3657d1dba23fc48d) |

All five are MIT licensed. Each directory includes its license notice.

Remove a directory, and its entry in `build/build-native-helpers.js`, once its package publishes a universal binary.
