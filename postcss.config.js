const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const uncss = require('uncss');

module.exports = {
  plugins: [autoprefixer, cssnano({ preset: 'default' }), uncss.postcssPlugin({ html: ['./src/index.html'] })],
};
