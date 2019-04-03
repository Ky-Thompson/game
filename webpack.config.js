const { join, resolve } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const root = resolve(__dirname);

const DEVELOPMENT_MODE = 'development';
const PRODUCTION_MODE = 'production';

const PHASER_DEVELOPMENT = 'node_modules/phaser/dist/phaser.js';
const PHASER_PRODUCTION = 'node_modules/phaser/dist/phaser.min.js';

module.exports.DEVELOPMENT_MODE = DEVELOPMENT_MODE;
module.exports.PRODUCTION_MODE = PRODUCTION_MODE;

module.exports.webpackConfig = (mode) => ({
  entry: './src/main.ts',
  output: {
    path: join(root, 'dist'),
    filename: 'bundle.js',
    publicPath: '',
  },
  mode: mode || PRODUCTION_MODE,
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader', include: join(__dirname, 'src'), exclude: '/node_modules/' },
      { test: /phaser\.js$/, loader: 'expose-loader?Phaser' },
      { test: [/\.vert$/, /\.frag$/], use: 'raw-loader' },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      phaser: join(root, mode === PRODUCTION_MODE ? PHASER_PRODUCTION : PHASER_DEVELOPMENT),
    },
    plugins: [new TsconfigPathsPlugin()],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || 'true')),
      WEBGL_RENDERER: JSON.stringify(true),
      CANVAS_RENDERER: JSON.stringify(true),
    }),
    new HtmlWebpackPlugin({
      hash: true,
      template: join(root, 'src/index.html'),
      filename: join(root, 'dist/index.html'),
    }),
  ],
  performance: {
    maxEntrypointSize: 1048576, // 1MB
    maxAssetSize: 1048576, // 1MB
  },
});
