import {useState, useEffect, useMemo} from 'react'
import useDarkMode from '../hooks/dark-mode';
import {remote} from 'electron';

const GlobalStyles = () => {
  const [accentColor, setAccentColor] = useState(remote.systemPreferences.getAccentColor());
  const isDarkMode = useDarkMode();

  const systemColors = useMemo(() => {
    return systemColorNames
      .map(name => `--system-${name}: ${remote.systemPreferences.getColor(name as any)};`)
      .join('\n');
  }, [isDarkMode]);

  const updateAccentColor = (_, accentColor) => setAccentColor(accentColor);

  useEffect(() => {
    remote.systemPreferences.on('accent-color-changed', updateAccentColor);

    // return () => {
    //   api.systemPreferences.off('accent-color-changed', updateAccentColor);
    // };
  }, []);

  return (
    <style jsx global>{`
      html {
        font-size: 62.5%;
      }

      body,
      .cover-window {
        margin: 0;
        width: 100vw;
        height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      :root {
            --kap-blue: #007aff;
            --kap-blue-dark: #006be0;
            --kap-blue-light: #3287ff;

            --kap: var(--kap-blue);
            --accent: #${accentColor};

            --red: #ff3b30;
            --black: #000000;
            --dust: #606060;
            --storm: #808080;
            --cloud: #dddddd;
            --smoke: #f1f1f1;
            --white: #ffffff;

            --window-background-color: var(--white);

            --window-header-background: linear-gradient(-180deg, #f9f9f9 0%, #f1f1f1 100%);
            --window-header-box-shadow: 0 1px 0 0 #ddd, inset 0 1px 0 0 #fff;

            --title-color: var(--black);
            --subtitle-color: var(--dust);
            --link-color: var(--kap);

            --row-divider-color: #f1f1f1;
            --input-background-color: var(--white);
            --input-border-color: var(--cloud);
            --input-hover-border-color: #ccc;
            --input-shadow: none;

            --icon-focus-background-color: var(--smoke);
            --icon-color: var(--storm);
            --icon-hover-color: var(--dust);
            --switch-box-shadow: none;
            --switch-disabled-color: #ccc;
            --shortcut-key-background: #fff;
            --shortcut-key-border: #dddddd;
            --shortcut-box-shadow: none;
            --input-focus-border-color: #ccc;
            --cropper-button-background-color: transparent;

            ${systemColors}
          }

          .dark {
            --kap: #fff;
            --window-background-color: rgba(0, 0, 0, 0.3);

            --window-header-background: linear-gradient(-180deg, rgba(68, 68, 68, 0.8) 0%, rgba(51, 51, 51, 0.8) 100%);
            --window-header-box-shadow: inset 0 -1px 0 0 rgba(96, 96, 96, 0.2), 0 1px 0 0 #000000;

            --title-color: var(--white);
            --subtitle-color: #ffffff99;

            --cropper-button-background-color: var(--input-background-color);
            --row-divider-color: rgba(0, 0, 0, 0.2);
            --input-background-color: rgba(255, 255, 255, 0.1);
            --input-border-color: transparent;
            --input-shadow: 0 0 1px 0 rgba(0,0,0,0.40), 0 1px 1px 0 rgba(0,0,0,0.10), inset 0 1px 0 0 rgba(255,255,255,0.10);

            --icon-focus-background-color: rgba(255, 255, 255, 0.1);
            --icon-hover-color: var(--cloud);
            --switch-box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.2), 0px 1px 0px 0px rgba(0, 0, 0, 0.1);
            --switch-disabled-color: #666;
            --shortcut-key-border: transparent;
            --shortcut-key-background: #606060;
            --shortcut-box-shadow: 0 0 1px 0 rgba(0,0,0,0.40), 0 1px 1px 0 rgba(0,0,0,0.10), inset 0 1px 0 0 rgba(255,255,255,0.10);
            --input-hover-border-color: #666;
            --input-focus-border-color: rgba(255, 255, 255, 0.2);
          }

          @keyframes shake-left {
            10%,
            90% {
              transform: translate3d(-1px, 0, 0);
            }

            20%,
            80% {
              transform: translate3d(0, 0, 0);
            }

            30%,
            50%,
            70% {
              transform: translate3d(-4px, 0, 0);
            }

            40%,
            60% {
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes shake-right {
            10%,
            90% {
              transform: translate3d(1px, 0, 0);
            }

            20%,
            80% {
              transform: translate3d(0, 0, 0);
            }

            30%,
            50%,
            70% {
              transform: translate3d(4px, 0, 0);
            }

            40%,
            60% {
              transform: translate3d(0, 0, 0);
            }
          }

          .shake-left {
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            perspective: 1000px;
            animation: shake-left 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }

          .shake-right {
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            perspective: 1000px;
            animation: shake-right 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }

          @keyframes shake {
            10%,
            90% {
              transform: translate3d(-1px, 0, 0);
            }

            20%,
            80% {
              transform: translate3d(2px, 0, 0);
            }

            30%,
            50%,
            70% {
              transform: translate3d(-4px, 0, 0);
            }

            40%,
            60% {
              transform: translate3d(4px, 0, 0);
            }
          }

          .shake {
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            perspective: 1000px;
            animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }

          * { box-sizing: border-box; }
    `}</style>
  )
}

export default GlobalStyles;

const systemColorNames = [
  'control-background',
  'control',
  'control-text',
  'disabled-control-text',
  'find-highlight',
  'grid',
  'header-text',
  'highlight',
  'keyboard-focus-indicator',
  'label',
  'link',
  'placeholder-text',
  'quaternary-label',
  'scrubber-textured-background',
  'secondary-label',
  'selected-content-background',
  'selected-control',
  'selected-control-text',
  'selected-menu-item-text',
  'selected-text-background',
  'selected-text',
  'separator',
  'shadow',
  'tertiary-label',
  'text-background',
  'text',
  'under-page-background',
  'unemphasized-selected-content-background',
  'unemphasized-selected-text-background',
  'unemphasized-selected-text',
  'window-background',
  'window-frame-text'
];
