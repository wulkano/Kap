const babel = require('gulp-babel');
const gulp = require('gulp');
const pug = require('gulp-pug');
const uglify = require('gulp-uglify');

gulp.task('build', () => {
	gulp.src('app/src/pug/*')
		.pipe(pug())
		.pipe(gulp.dest('app/dist'));

	gulp.src('app/src/js/*')
		.pipe(babel({presets: ['es2015']}))
		.pipe(uglify())
		.pipe(gulp.dest('app/dist'));
});
