const chalk = require('chalk');
const webpack = require('webpack');
const { webpackConfig, DEVELOPMENT_MODE, PRODUCTION_MODE } = require('../webpack.config');

module.exports.DEVELOPMENT_MODE = DEVELOPMENT_MODE;
module.exports.PRODUCTION_MODE = PRODUCTION_MODE;

module.exports.buildScripts = (mode) => () =>
  new Promise((resolve, reject) => {
    webpack(webpackConfig(mode), (error, stats) => {
      if (error) {
        console.log(chalk.red(error));
        reject(new Error(error));
      } else if (stats.hasErrors()) {
        console.log(stats.toString({ colors: true }));
        reject(new Error('Webpack build failed.'));
      } else {
        console.log(stats.toString({ colors: true }));
        resolve();
      }
    });
  });

const watchOptions = { aggregateTimeout: 300, poll: undefined };

module.exports.watchScripts = () =>
  new Promise((resolve, reject) => {
    webpack(webpackConfig(DEVELOPMENT_MODE)).watch(watchOptions, (error, stats) => {
      if (error) {
        console.log(chalk.red(error));
        reject();
      } else {
        console.log(stats.toString({ colors: true }));
      }
    });
  });
