const { join } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const DEVELOPMENT_MODE = 'development';
const PRODUCTION_MODE = 'production';

const PHASER_DEVELOPMENT = 'node_modules/phaser/dist/phaser.js';
const PHASER_PRODUCTION = 'node_modules/phaser/dist/phaser.min.js';

module.exports.DEVELOPMENT_MODE = DEVELOPMENT_MODE;
module.exports.PRODUCTION_MODE = PRODUCTION_MODE;

module.exports.webpackConfig = (mode) => {
  const isProduction = mode === PRODUCTION_MODE;
  const scssLoaders = isProduction
    ? ['style-loader', MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader']
    : ['style-loader', MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'];
  const phaserScript = isProduction ? PHASER_PRODUCTION : PHASER_DEVELOPMENT;

  return {
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
        { test: /\.scss$/, use: scssLoaders },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        phaser: join(__dirname, phaserScript),
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
        filename: isProduction ? 'style.[hash].css' : 'style.css',
        chunkFilename: isProduction ? '[id].[hash].css' : '[id].css',
      }),
      new HtmlWebpackPlugin({
        hash: true,
        template: join(__dirname, 'src/index.html'),
        filename: join(__dirname, 'dist/index.html'),
      }),
      new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false }),
    ],
    performance: {
      maxEntrypointSize: 1500000, // 1.5MB
      maxAssetSize: 1500000, // 1.5MB
    },
  };
};
