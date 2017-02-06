const colors = {
  red: '#FF6159',
  green: '#28CA42',
  blue: '#3B99FC',
  grey: '#414141',
  blueDark: '#2D91FC',

  greyLighter: '#D7D7D7',
  greyLight: '#919191',
  greyDark: '#2D2D2D',
  greyDarker: '#222222'
}

const stuff = {
  fontSizeDefault: '1.4rem',

  backgroundPrimary: colors.greyDarker,
  backgroundSecondary: colors.greyDark,
  backgroundLight: 'white',

  colorPrimary: colors.greyLighter,
  colorSecondary: 'white',
  colorDark: 'grey',
  dividerColor: colors.greyDark,
  boxShadowInputs: '0 1px 1px 0 rgba(0, 0, 0, .2), 0 0 0 1px rgba(0, 0, 0, .1)',

  'window-border-radius': '5px'
}

const helpers = {
  webkitDrag: {
    '-webkit-app-region': 'drag',
    cursor: '-webkit-grab'
  },
  fullWidth: {
    width: '100%'
  },
  hidden: {
    display: 'none !important'
  },
  circle: {
    'border-radius': '50%'
  },
  noSelect: {
    '-webkit-user-select': 'none !important',
    cursor: 'default !important'
  }
}

export default Object.assign(colors, stuff, helpers)
