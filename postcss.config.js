const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const uncss = require('uncss');

module.exports = {
  plugins: [
    autoprefixer,
    cssnano({ preset: 'default' }),
    uncss.postcssPlugin({ ignore: [/canvas/], html: ['./src/index.hbs', './src/partials/*.hbs'] }),
  ],
};
