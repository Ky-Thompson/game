const { join } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

const package = require('./package.json');

const DEVELOPMENT_MODE = 'development';
const PRODUCTION_MODE = 'production';
const VERSION = 'caleb-sophia-madrid@' + package.version;

const PHASER_DEVELOPMENT = 'node_modules/phaser/dist/phaser.js';
const PHASER_PRODUCTION = 'node_modules/phaser/dist/phaser.min.js';

module.exports.DEVELOPMENT_MODE = DEVELOPMENT_MODE;
module.exports.PRODUCTION_MODE = PRODUCTION_MODE;

module.exports.VERSION = VERSION;

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
        { test: /\.svg$/, use: { loader: 'svg-url-loader' } },
        {
          test: /\.(hbs|html)$/, // So that we can import favicons generated html
          loader: 'handlebars-loader',
          options: {
            partialDirs: [join(__dirname, 'src/partials')],
          },
        },
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
        VERSION: JSON.stringify(VERSION),
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? 'style.[hash].css' : 'style.css',
        chunkFilename: isProduction ? '[id].[hash].css' : '[id].css',
      }),
      new HtmlWebpackPlugin({
        isProduction: isProduction,
        version: VERSION,
        template: join(__dirname, 'src/index.hbs'),
        filename: join(__dirname, 'dist/index.html'),
      }),
      new SentryWebpackPlugin({
        release: VERSION,
        include: './dist',
        ignore: ['node_modules', 'webpack.config.js'],
        dryRun: !isProduction,
      }),
      new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false }),
    ],
    performance: {
      maxEntrypointSize: 2.5 * 1024 * 1024, // 2.5 Mb
      maxAssetSize: 2.5 * 1024 * 1024, // 2.5 Mb
    },
    devtool: isProduction ? 'source-map' : 'eval',
  };
};
