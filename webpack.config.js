const { join, resolve } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const root = resolve(__dirname);

module.exports = {
  entry: './src/main.ts',
  output: {
    path: join(root, 'dist'),
    filename: 'bundle.js',
    publicPath: '',
  },
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
      phaser: join(root, 'node_modules/phaser/dist/phaser.min.js'),
    },
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
};
