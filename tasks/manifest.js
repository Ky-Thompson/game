const gulp = require('gulp');
const watch = require('gulp-watch');

module.exports.buildManifest = () => gulp.src('./src/manifest.json').pipe(gulp.dest('./dist/'));

const ignoreInitial = { ignoreInitial: false };
module.exports.watchManifest = () => watch('./src/manifest.json', ignoreInitial).pipe(gulp.dest('./dist/'));
