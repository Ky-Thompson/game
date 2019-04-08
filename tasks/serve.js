var browserSync = require('browser-sync').create();

module.exports.serve = () => {
  browserSync.init({
    server: {
      baseDir: './dist',
    },
    files: ['./dist/*.*', './dist/**/*.*'],
    watch: true,
    reloadDelay: 500,
    reloadDebounce: 100,
    reloadOnRestart: true,
    notify: true,
    localOnly: true,
  });
};
