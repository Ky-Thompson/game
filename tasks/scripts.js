const chalk = require('chalk');
const webpack = require('webpack');
const webpackConfig = require('../webpack.config');

module.exports.buildScripts = () =>
  new Promise((resolve, reject) => {
    webpack({ ...webpackConfig, mode: 'production' }, (error, stats) => {
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
    webpack({ ...webpackConfig, mode: 'development' }).watch(watchOptions, (error, stats) => {
      if (error) {
        console.log(chalk.red(error));
        reject();
      } else {
        console.log(stats.toString({ colors: true }));
      }
    });
  });
