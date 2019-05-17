var browserSync = require('browser-sync').create();
const { PRODUCTION_MODE } = require('./scripts');

module.exports.serve = (mode) => () => {
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
    port: mode === PRODUCTION_MODE ? 8080 : 3000,
    ui: false,
  });
};
