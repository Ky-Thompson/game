const gulp = require('gulp');

const { clean } = require('./tasks/clean');
const { serve } = require('./tasks/serve');
const { assetTypes, buildAsset, buildPack, watchAsset, watchPack } = require('./tasks/assets');
const { buildManifest, watchManifest } = require('./tasks/manifest');
const { buildScripts, watchScripts } = require('./tasks/scripts');
const { buildSprites, watchSprites } = require('./tasks/sprites');

// Common tasks
gulp.task('clean', clean);
gulp.task('serve', serve);

// Build
gulp.task('build:scripts', buildScripts);
gulp.task('build:sprites', buildSprites);
gulp.task('build:pack', buildPack);
gulp.task('build:manifest', buildManifest);
assetTypes.forEach((type) => gulp.task('build:' + type, buildAsset(type)));

gulp.task(
  'build',
  gulp.series(
    'clean',
    gulp.parallel('build:scripts', 'build:sprites', 'build:pack', 'build:manifest', ...assetTypes.map((type) => 'build:' + type))
  )
);

// Watch
gulp.task('watch:scripts', watchScripts);
gulp.task('watch:sprites', () => gulp.watch(watchSprites, { ignoreInitial: false }, gulp.series('build:sprites')));
gulp.task('watch:pack', watchPack);
gulp.task('watch:manifest', watchManifest);
assetTypes.forEach((type) => gulp.task('watch:' + type, watchAsset(type)));

gulp.task(
  'watch',
  gulp.series(
    'clean',
    'build:scripts',
    gulp.parallel('serve', 'watch:scripts', 'watch:sprites', 'watch:pack', 'watch:manifest', ...assetTypes.map((type) => 'watch:' + type))
  )
);
