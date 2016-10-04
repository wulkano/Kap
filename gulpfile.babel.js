import babel from 'gulp-babel';
import cssnano from 'cssnano';
import gulp from 'gulp';
import injectSvg from 'gulp-inject-svg';
import postcss from 'gulp-postcss';
import postcssExtend from 'postcss-extend';
import postcssNested from 'postcss-nested';
import postcsssSimpleVars from 'postcss-simple-vars';
import pug from 'gulp-pug';

gulp.task('build:main', () =>
  gulp.src('app/src/main/*.js')
    .pipe(babel())
    .pipe(gulp.dest('app/dist')));

gulp.task('build:pug', () =>
  gulp.src('app/src/renderer/pug/*')
    .pipe(pug())
    .pipe(injectSvg())
    .pipe(gulp.dest('app/dist')));

gulp.task('build:css', () =>
  gulp.src('app/src/renderer/css/*')
    .pipe(postcss([postcsssSimpleVars, postcssExtend, postcssNested, cssnano]))
    .pipe(gulp.dest('app/dist')));

gulp.task('build:js', () =>
  gulp.src('app/src/renderer/js/*.js')
    .pipe(babel())
    .pipe(gulp.dest('app/dist')));

gulp.task('build', ['build:main', 'build:pug', 'build:css', 'build:js']);

gulp.task('default', ['build']);

gulp.task('watch', ['build'], () => {
  gulp.watch('app/src/renderer/pug/*.pug', ['build:pug']);
  gulp.watch('app/src/renderer/css/*.css', ['build:css']);
  gulp.watch('app/src/renderer/js/*.js', ['build:js']);
  gulp.watch('app/src/main/*.js', ['build:main']);
});
