const gulp = require('gulp');

const { clean } = require('./tasks/clean');
const { serve } = require('./tasks/serve');
const { assetTypes, buildAsset, buildPack, watchAsset, watchPack } = require('./tasks/assets');
const { buildScripts, watchScripts } = require('./tasks/scripts');
const { buildSprites, watchSprites } = require('./tasks/sprites');

// Common tasks
gulp.task('clean', clean);
gulp.task('serve', serve);

// Build
gulp.task('build:scripts', buildScripts);
gulp.task('build:sprites', buildSprites);
gulp.task('build:pack', buildPack);
assetTypes.forEach((type) => gulp.task('build:' + type, buildAsset(type)));

gulp.task(
  'build',
  gulp.series('clean', gulp.parallel('build:scripts', 'build:sprites', 'build:pack', ...assetTypes.map((type) => 'build:' + type)))
);

// Watch
gulp.task('watch:scripts', watchScripts);
gulp.task('watch:sprites', () => gulp.watch(watchSprites, { ignoreInitial: false }, gulp.series('build:sprites')));
gulp.task('watch:pack', watchPack);
assetTypes.forEach((type) => gulp.task('watch:' + type, watchAsset(type)));

gulp.task(
  'watch',
  gulp.series(
    'clean',
    'build:scripts',
    gulp.parallel('serve', 'watch:scripts', 'watch:sprites', 'watch:pack', ...assetTypes.map((type) => 'watch:' + type))
  )
);
