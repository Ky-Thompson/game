var browserSync = require('browser-sync').create();

module.exports.serve = () => {
  browserSync.init({
    server: {
      baseDir: './dist',
    },
    files: ['./dist/**/*'],
    watch: true,
    watchEvents: ['change', 'add', 'unlink', 'addDir', 'unlinkDir'],
    reloadDelay: 500,
    reloadDebounce: 100,
    reloadOnRestart: true,
    notify: true,
    localOnly: true,
    port: 8080,
    ui: false,
  });
};
