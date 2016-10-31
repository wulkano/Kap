import babel from 'gulp-babel';
import cssnano from 'cssnano';
import gulp from 'gulp';
import injectSvg from 'gulp-inject-svg';
import postcss from 'gulp-postcss';
import postcssExtend from 'postcss-extend';
import postcssNested from 'postcss-nested';
import postcsssSimpleVars from 'postcss-simple-vars';
import atImport from 'postcss-import';
import pug from 'gulp-pug';

gulp.task('build:js:main', () =>
  gulp.src('app/src/main/*.js')
    .pipe(babel())
    .pipe(gulp.dest('app/dist/main')));

gulp.task('build:pug', () =>
  gulp.src('app/src/renderer/pug/*')
    .pipe(pug())
    .pipe(injectSvg())
    .pipe(gulp.dest('app/dist/renderer/html')));

gulp.task('build:css', () =>
  gulp.src('app/src/renderer/css/*')
    .pipe(postcss([atImport, postcsssSimpleVars, postcssExtend, postcssNested, cssnano]))
    .pipe(gulp.dest('app/dist/renderer/css')));

gulp.task('build:js:renderer', () =>
  gulp.src('app/src/renderer/js/*.js')
    .pipe(babel())
    .pipe(gulp.dest('app/dist/renderer/js')));

gulp.task('build:scripts', () =>
  gulp.src('app/src/scripts/*.js')
    .pipe(babel())
    .pipe(gulp.dest('app/dist/scripts')));

gulp.task('build:js:common', () =>
  gulp.src('app/src/common/*.js')
    .pipe(babel())
    .pipe(gulp.dest('app/dist/common')));

gulp.task('build', ['build:js:main', 'build:pug', 'build:css', 'build:js:renderer', 'build:scripts', 'build:js:common']);

gulp.task('default', ['build']);

gulp.task('watch', ['build'], () => {
  gulp.watch('app/src/main/*.js', ['build:js:main']);
  gulp.watch('app/src/renderer/pug/*.pug', ['build:pug']);
  gulp.watch('app/src/renderer/css/*.css', ['build:css']);
  gulp.watch('app/src/renderer/js/*.js', ['build:js:renderer']);
  gulp.watch('app/src/scripts/*.js', ['build:scripts']);
  gulp.watch('app/src/common/*.js', ['build:js:common']);
});
