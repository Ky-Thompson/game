const chalk = require('chalk');
const workboxBuild = require('workbox-build');
const filesize = require('filesize');

module.exports.buildWorkbox = () => {
  return workboxBuild
    .injectManifest({
      swSrc: 'src/service-worker.js',
      swDest: 'dist/service-worker.js',
      globDirectory: 'dist',
      globPatterns: ['**/*.{js,css,html}', 'assets/**/*.{json,png,ogg}'],
    })
    .then(({ count, size, warnings }) => {
      warnings.forEach(console.warn);
      console.log(chalk.green.bold(`${count} files will be precached, totaling ${filesize(size)}`));
    });
};
