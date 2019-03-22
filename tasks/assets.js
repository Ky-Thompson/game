const gulp = require('gulp');
const watch = require('gulp-watch');

module.exports.assetTypes = ['audio', 'fonts', 'images', 'json', 'music', 'tilemaps'];

module.exports.buildAsset = (type) => () => gulp.src('./src/assets/' + type + '/*').pipe(gulp.dest('./dist/assets/' + type));
module.exports.buildPack = () => gulp.src('./src/assets/pack.json').pipe(gulp.dest('./dist/assets/'));

const ignoreInitial = { ignoreInitial: false };
module.exports.watchAsset = (type) => () => watch('./src/assets/' + type + '/*', ignoreInitial).pipe(gulp.dest('./dist/assets/' + type));
module.exports.watchPack = () => watch('./src/assets/pack.json', ignoreInitial).pipe(gulp.dest('./dist/assets/'));
