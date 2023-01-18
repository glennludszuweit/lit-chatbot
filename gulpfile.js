import gulp from 'gulp';
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';

const scripts = [
  './src/js/assets/smoothscroll-polyfill.js',
  './src/js/assets/socket.io.js',
  './src/js/assets/tail.datetime.min.js',
  './src/js/assets/webcomponents-bundle.js',
  './src/js/controllers/chat-controller.js',
  './src/js/controllers/socket-controller.js',
];

const dest = './src/js';

gulp.task('watch', function () {
  gulp.watch(scripts, gulp.series(['chatbot']));
});

gulp.task('chatbot', function () {
  return gulp
    .src(scripts)
    .pipe(concat('deutschlandticket.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(dest));
});
