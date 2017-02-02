const {join: pathJoin, resolve: resolvePath} = require('path');

const Copy = require('copy-webpack-plugin');
const Shell = require('webpack-shell-plugin');

function joinPath(...paths) {
  return pathJoin(...paths);
}

const SRC_MAIN = joinPath(__dirname, 'app', 'src', 'main');
const SRC_RENDERER = joinPath(__dirname, 'app', 'src', 'renderer');
const SRC_RENDERER_JS = joinPath(SRC_RENDERER, 'old', 'js');

module.exports = {
  // devtool: TODO(matheuss): For some reason, any option here makes electron
  // throw some weird error. We should investigate this ASAP
  node: {
    __dirname: false
  },
  externals: {
    aperture: 'require("aperture")'
  },
  target: 'electron',
  entry: {
    main: joinPath(SRC_MAIN, 'index.js'),
    'main-renderer': joinPath(SRC_RENDERER_JS, 'main.js'),
    cropper: joinPath(SRC_RENDERER_JS, 'cropper.js'),
    editor: joinPath(SRC_RENDERER_JS, 'editor.js'),
    preferences: joinPath(SRC_RENDERER_JS, 'preferences.js')
  },
  output: {
    path: joinPath('app', 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [
          resolvePath('node_modules'),
          resolvePath('app', 'node_modules')
        ]
      },
      {
        test: /\.css$/,
        include: SRC_RENDERER,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  plugins: [
    new Copy([
      {
        from: 'app/src/**/*.html',
        // no clue on how the files are going
        // to app/dist without the `to` prop here
        flatten: true
      },
      {
        from: 'app/vendor/*',
        flatten: true
      }
    ]),
    new Shell({
      onBuildEnd: ['chmod +x ./app/dist/ffmpeg']
    })
  ]
};
