const gulp = require('gulp');
const favicons = require('favicons').stream;

module.exports.buildFavicons = () =>
  gulp
    .src('./src/assets/images/favicon.png')
    .pipe(
      favicons({
        path: './',
        html: 'favicons.html',
        appName: 'Caleb & Sophia Game',
        appShortName: 'Caleb & Sophia Game',
        appDescription: 'Caleb & Sophia Game',
        url: 'https://caleb-sophia-madrid.github.io/game/',
        start_url: '.',
        background: '#33A5FF',
        theme_color: '#343A40',
        appleStatusBarStyle: 'black-translucent',
        display: 'standalone',
        orientation: 'landscape',
        version: 1.0,
        logging: false,
        pixel_art: true,
        pipeHTML: true,
        replace: true,
        icons: {
          android: true,
          appleIcon: true,
          appleStartup: true,
          favicons: true,
          firefox: true,
          windows: true,
          coast: false,
          yandex: false,
        },
      })
    )
    .pipe(gulp.dest('./dist'));
