const gulp = require('gulp');
const pug = require('gulp-pug');

gulp.task('build', () => {
	gulp.src('app/src/pug/*')
		.pipe(pug())
		.pipe(gulp.dest('app/dist'));
});
