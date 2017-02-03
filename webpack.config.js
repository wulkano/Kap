const {join: pathJoin, resolve: resolvePath} = require('path')

const Copy = require('copy-webpack-plugin')
const Shell = require('webpack-shell-plugin')
const LiveReload = require('webpack-livereload-plugin')

function joinPath(...paths) {
  return pathJoin(...paths)
}

const SRC_MAIN = joinPath(__dirname, 'app', 'src', 'main')
const SRC_RENDERER = joinPath(__dirname, 'app', 'src', 'renderer')
const SRC_RENDERER_JS = joinPath(SRC_RENDERER, 'old', 'js')

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
    'main-window': joinPath(SRC_RENDERER, 'js', 'main.js'),
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
        include: [
          SRC_MAIN
        ],
        exclude: [
          resolvePath('node_modules'),
          resolvePath('app', 'node_modules')
        ],
        options: {
          plugins: [
            'transform-es2015-modules-commonjs'
          ]
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          SRC_RENDERER
        ],
        exclude: [
          resolvePath('node_modules'),
          resolvePath('app', 'node_modules')
        ],
        options: {
          plugins: [
            'styled-jsx/babel'
          ],
          presets: [
            'react'
          ]
        }
      },
      {
        test: /\.css$/,
        include: SRC_RENDERER,
        use: [
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  plugins: [
    new Copy([
      {
        // this one is for the old views
        from: 'app/src/renderer/old/views/*.html',
        ignore: '**/main.html',
        flatten: true
      },
      {
        // this one is for the new views
        from: 'app/src/renderer/views/*.html',
        flatten: true
      },
      {
        from: 'app/vendor/*',
        flatten: true
      }
    ]),
    new Shell({
      onBuildEnd: ['chmod +x ./app/dist/ffmpeg']
    }),
    new LiveReload()
  ]
}
