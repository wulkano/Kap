import {src, dest, watch as watchSrc, parallel, series} from 'gulp';
import babel from 'gulp-babel';
import del from 'del';
import cssnano from 'cssnano';
import injectSvg from 'gulp-inject-svg';
import postcss from 'gulp-postcss';
import postcssExtend from 'postcss-extend';
import postcssNested from 'postcss-nested';
import postcsssSimpleVars from 'postcss-simple-vars';
import postcssEach from 'postcss-each';
import atImport from 'postcss-import';
import reporter from 'postcss-reporter';
import pug from 'gulp-pug';

// Directories
const SRC_DIR = 'app/src';
const DIST_DIR = 'app/dist';

// Source files
const JS_GLOB = `${SRC_DIR}/**/*.js`;
const CSS_GLOB = `${SRC_DIR}/**/*.css`;
const CSS_PARTIALS_GLOB = `${SRC_DIR}/**/_*.css`;
const VIEWS_GLOB = `${SRC_DIR}/**/*.pug`;
const VIEWS_PARTIALS_GLOB = `${SRC_DIR}/**/_*.pug`;
const SVG_GLOB = `app/static/**/*.svg`;

// Clean DIST directory
export function clean() {
  return del([DIST_DIR]);
}

// JS Task
export function scripts() {
  return src(JS_GLOB, {base: SRC_DIR})
    .pipe(babel())
    .pipe(dest(DIST_DIR));
}

export function views() {
  return src([VIEWS_GLOB, `!${VIEWS_PARTIALS_GLOB}`], {base: SRC_DIR})
    .pipe(pug())
    .pipe(injectSvg())
    .pipe(dest(DIST_DIR));
}

export function styles() {
  return src([CSS_GLOB, `!${CSS_PARTIALS_GLOB}`], {base: SRC_DIR})
    .pipe(postcss([atImport, postcssEach, postcsssSimpleVars, postcssExtend, postcssNested, cssnano, reporter()]))
    .pipe(dest(DIST_DIR));
}

export function watch() {
  watchSrc(JS_GLOB, scripts);
  watchSrc(CSS_GLOB, styles);
  watchSrc(VIEWS_GLOB, views);
  watchSrc(SVG_GLOB, views);
}

const mainTasks = parallel(scripts, styles, views);
export const build = series(clean, mainTasks);
export const dev = series(clean, mainTasks, watch);

// Set default task
export default build;
