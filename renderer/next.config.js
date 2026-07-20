const path = require('path');

module.exports = (nextConfig) => {
  return Object.assign({}, nextConfig, {
    webpack(config, options) {
      config.module.rules.push({
        test: /\.+(js|jsx|mjs|ts|tsx)$/,
        loader: options.defaultLoaders.babel,
        include: [
          path.join(__dirname, '..', 'main', 'common'),
          path.join(__dirname, '..', 'main', 'remote-states', 'use-remote-state.ts')
        ]
      });

      // The server build only produces the static HTML shell. Keep its default
      // Node target so Electron-only modules are never evaluated there.
      if (!options.isServer) {
        config.target = 'electron-renderer';
      }
      config.devtool = 'cheap-module-source-map';

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }

      return config;
    }
  })
}
