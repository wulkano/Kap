const babel = require('gulp-babel');
const cssnano = require('cssnano');
const gulp = require('gulp');
const postcss = require('gulp-postcss');
const pug = require('gulp-pug');
const uglify = require('gulp-uglify');

gulp.task('build', () => {
	gulp.src('app/src/pug/*')
		.pipe(pug())
		.pipe(gulp.dest('app/dist'));

	gulp.src('app/src/css/*')
		.pipe(postcss([cssnano]))
		.pipe(gulp.dest('app/dist'));

	gulp.src('app/src/js/*')
		.pipe(babel({presets: ['es2015']}))
		.pipe(uglify())
		.pipe(gulp.dest('app/dist'));
});

gulp.task('watch', ['build'], () => {
	gulp.watch('app/src/**', ['build']);
});
