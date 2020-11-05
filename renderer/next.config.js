const path = require('path');
module.exports = (nextConfig) => {
  return Object.assign({}, nextConfig, {
    webpack(config, options) {
      config.module.rules.push({
        test: /\.+(js|jsx|mjs|ts|tsx)$/,
        loader: options.defaultLoaders.babel,
        include: [
          path.join(__dirname, '..', 'main', 'common', 'constants.ts'),
          path.join(__dirname, '..', 'main', 'remote-states', 'use-remote-state.ts')
        ]
      });

      config.target = 'electron-renderer';
      config.devtool = 'cheap-module-source-map';

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }

      return config;
    }
  })
}

// exports.webpack = (nextConfig, options) => {
//   console.log(nextConfig);
//   // Fix for allowing TS files from a parent location to be transpiled
//   // https://github.com/vercel/next.js/issues/5666
//   // config.module.rules.forEach((rule) => {
//   //   console.log('\n\n\nPLZ\n', rule);
//   //   const ruleContainsTs = rule.test && rule.test.toString().includes('tsx|ts');

//   //   if (ruleContainsTs && rule.use && rule.use.loader === 'next-babel-loader') {
//   //     rule.include = undefined;
//   //   }
//   // });

//   // config.module.rules.push({
//   //   test: /\.+(js|jsx|mjs|ts|tsx)$/,
//   //   use: options.defaultLoaders.babel,
//   //   include: includes
//   // });

//   x = Object.assign({}, nextConfig, {
//     target: 'electron-renderer',
//     devtool: 'cheap-module-source-map',
//     plugins: nextConfig.plugins.filter(p => p.constructor.name !== 'UglifyJsPlugin'),
//     webpack(config, options) {
//       config.module.rules.push({
//         test: /\.+(js|jsx|mjs|ts|tsx)$/,
//         loader: options.defaultLoaders.babel,
//         include: [
//           path.join(__dirname, '..', 'main', 'common', 'constants.ts'),
//           path.join(__dirname, '..', 'main', 'remote-states', 'use-remote-state.ts')
//         ]
//       });

//       if (typeof nextConfig.webpack === 'function') {
//         return nextConfig.webpack(config, options);
//       }

//       return config;
//     }
//   });

//   console.log(x);
//   console.log(JSON.stringify(x.module, null, 2))
//   return x;
// };

// // exports.exportPathMap = () => ({
// //   '/cropper': {page: '/cropper'},
// //   '/editor': {page: '/editor'},
// //   '/preferences': {page: '/preferences'},
// //   '/exports': {page: '/exports'},
// //   '/config': {page: '/config'},
// //   '/dialog': {page: '/dialog'}
// // });
