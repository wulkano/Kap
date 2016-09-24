const babel = require('gulp-babel');
const cssnano = require('cssnano');
const gulp = require('gulp');
const injectSvg = require('gulp-inject-svg');
const postcss = require('gulp-postcss');
const postcssExtend = require('postcss-extend');
const postcssNested = require('postcss-nested');
const postcsssSimpleVars = require('postcss-simple-vars');
const pug = require('gulp-pug');
const uglify = require('gulp-uglify');

gulp.task('build:main', () =>
  gulp.src('app/main.js')
    .pipe(babel({presets: ['es2015']}))
    .pipe(uglify())
    .pipe(gulp.dest('app/dist')));

gulp.task('build:pug', () =>
  gulp.src('app/src/pug/*')
    .pipe(pug())
    .pipe(injectSvg())
    .pipe(gulp.dest('app/dist')));

gulp.task('build:css', () =>
  gulp.src('app/src/css/*')
    .pipe(postcss([postcsssSimpleVars, postcssExtend, postcssNested, cssnano]))
    .pipe(gulp.dest('app/dist')));

gulp.task('build:js', () =>
  gulp.src('app/src/js/*')
    .pipe(babel({presets: ['es2015']}))
    .pipe(uglify())
    .pipe(gulp.dest('app/dist')));

gulp.task('build', ['build:main', 'build:pug', 'build:css', 'build:js']);

gulp.task('default', ['build']);

gulp.task('watch', ['build'], () => {
  gulp.watch('app/src/pug/*.pug', ['build:pug']);
  gulp.watch('app/src/css/*.css', ['build:css']);
  gulp.watch('app/src/js/*.js', ['build:js']);
  gulp.watch('app/main.js', ['build:main']);
});
