const chalk = require('chalk');
const webpack = require('webpack');
const { webpackConfig, DEVELOPMENT_MODE, PRODUCTION_MODE } = require('../webpack.config');

module.exports.buildScripts = () =>
  new Promise((resolve, reject) => {
    webpack(webpackConfig(PRODUCTION_MODE), (error, stats) => {
      if (error) {
        console.log(chalk.red(error));
        reject();
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
