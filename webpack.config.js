const { join } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const DEVELOPMENT_MODE = 'development';
const PRODUCTION_MODE = 'production';

const PHASER_DEVELOPMENT = 'node_modules/phaser/dist/phaser.js';
const PHASER_PRODUCTION = 'node_modules/phaser/dist/phaser.min.js';

module.exports.DEVELOPMENT_MODE = DEVELOPMENT_MODE;
module.exports.PRODUCTION_MODE = PRODUCTION_MODE;

module.exports.webpackConfig = (mode) => ({
  entry: './src/main.ts',
  output: {
    path: join(__dirname, 'dist'),
    filename: mode === PRODUCTION_MODE ? '[name].[chunkhash].js' : '[name].js',
    publicPath: '',
  },
  mode: mode || PRODUCTION_MODE,
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader', include: join(__dirname, 'src'), exclude: '/node_modules/' },
      { test: /phaser\.js$/, loader: 'expose-loader?Phaser' },
      { test: [/\.vert$/, /\.frag$/], use: 'raw-loader' },
      { test: /\.css$/, use: ['style-loader', MiniCssExtractPlugin.loader, 'css-loader'] },
      { test: /\.scss$/, use: ['style-loader', MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'] },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      phaser: join(__dirname, mode === PRODUCTION_MODE ? PHASER_PRODUCTION : PHASER_DEVELOPMENT),
    },
    plugins: [new TsconfigPathsPlugin()],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || 'true')),
      WEBGL_RENDERER: JSON.stringify(true),
      CANVAS_RENDERER: JSON.stringify(true),
    }),
    new MiniCssExtractPlugin({
      filename: mode === PRODUCTION_MODE ? '[name].[hash].css' : '[name].css',
      chunkFilename: mode === PRODUCTION_MODE ? '[id].[hash].css' : '[id].css',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      template: join(__dirname, 'src/index.html'),
      filename: join(__dirname, 'dist/index.html'),
    }),
  ],
  performance: {
    maxEntrypointSize: 1048576, // 1MB
    maxAssetSize: 1048576, // 1MB
  },
});
