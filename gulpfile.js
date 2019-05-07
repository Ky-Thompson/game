const gulp = require('gulp');

const { clean } = require('./tasks/clean');
const { serve } = require('./tasks/serve');
const { assetTypes, buildAsset, buildPack, watchAsset, watchPack } = require('./tasks/assets');
const { buildFavicons } = require('./tasks/favicons');
const { buildScripts, watchScripts, DEVELOPMENT_MODE, PRODUCTION_MODE } = require('./tasks/scripts');
const { buildSprites, watchSprites } = require('./tasks/sprites');

// Common tasks
gulp.task('clean', clean);
gulp.task('serve', serve);

// Build
gulp.task('build:scripts', buildScripts(PRODUCTION_MODE));
gulp.task('build:sprites', buildSprites);
gulp.task('build:pack', buildPack);
gulp.task('build:favicons', buildFavicons);
assetTypes.forEach((type) => gulp.task('build:' + type, buildAsset(type)));

gulp.task(
  'build',
  gulp.series(
    'clean',
    'build:favicons',
    gulp.parallel('build:scripts', 'build:sprites', 'build:pack', ...assetTypes.map((type) => 'build:' + type))
  )
);

// Watch
gulp.task('watch:scripts:initial', buildScripts(DEVELOPMENT_MODE));
gulp.task('watch:scripts', watchScripts);
gulp.task('watch:sprites', () => gulp.watch(watchSprites, { ignoreInitial: false }, gulp.series('build:sprites')));
gulp.task('watch:pack', watchPack);
assetTypes.forEach((type) => gulp.task('watch:' + type, watchAsset(type)));

gulp.task(
  'watch',
  gulp.series(
    'clean',
    'build:favicons',
    'watch:scripts:initial',
    gulp.parallel('serve', 'watch:scripts', 'watch:sprites', 'watch:pack', ...assetTypes.map((type) => 'watch:' + type))
  )
);
