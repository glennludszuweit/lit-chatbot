import gulp from 'gulp';
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';

const scripts = [
  './src/assets/js/assets/smoothscroll-polyfill.js',
  './src/assets/js/assets/socket.io.js',
  './src/assets/js/assets/tail.datetime.min.js',
  './src/assets/js/assets/webcomponents-bundle.js',
  './src/assets/js/controllers/chat-controller.js',
  './src/assets/js/controllers/socket-controller.js',
];

const dest = './src/assets/js';

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
