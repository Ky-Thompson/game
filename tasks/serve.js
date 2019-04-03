var browserSync = require('browser-sync').create();

module.exports.serve = () => {
  browserSync.init({
    server: {
      baseDir: './dist',
    },
    files: ['./dist/*', './dist/**/*'],
    watch: true,
    reloadDelay: 1000,
    reloadDebounce: 100,
    reloadOnRestart: true,
    notify: false,
    localOnly: true,
  });
};
