const chalk = require('chalk');
const workboxBuild = require('workbox-build');
const filesize = require('filesize');

module.exports.buildWorkbox = async () => {
  const { count, size, warnings } = await workboxBuild.injectManifest({
    swSrc: 'src/service-worker.js',
    swDest: 'dist/service-worker.js',
    globDirectory: 'dist',
    globPatterns: ['index.html', '*.{js,css}', 'assets/**/*.{json,png,ogg}'],
    dontCacheBustURLsMatching: /\.\w{20}\./,
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 Mb
  });

  if (warnings && warnings.length) {
    warnings.forEach((warning) => console.log(chalk.yellow(warning)));
    throw new Error('Workbox could not build the service worker.');
  } else if (!count) {
    throw new Error('No files to cache.');
  }

  console.log(chalk.green.bold(`${count} files will be precached, totaling ${filesize(size)}`));
};
