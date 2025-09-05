// Include gulp.
const gulp     = require('gulp');
const series   = require('gulp');
const parallel = require('gulp');

// Include plugins.
const sass      = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const rename    = require('gulp-rename');

// read parameters
const argv      = require('yargs').argv;
const isDebug = argv.production === undefined;
const isProd = !isDebug;

// init
const initMsg = isDebug
    ? 'Build assets in debug-mode'
    : 'Build assets (use `--debug` for unminified version)';

console.log('\x1b[7m%s\x1b[0m', '\n---------- ' + initMsg + ' ----------');

const sourcePath = './src-client/scss';
const targetPath = './dist-client/css';
const targetPathJs = "./dist-client/js";

const compileFile = function(file, targetFilepath)
{
    console.info("Compile " + file)
    const css_file = gulp.src(sourcePath + file).pipe(sass());
    const dirTarget = targetFilepath === undefined ? targetPath : targetFilepath;
    return css_file
        .pipe(rename({extname : '.css'}))
        .pipe(gulp.dest(dirTarget));

}

// 
// Task to compile sass
// 
gulp.task('compile-sass-about', () => compileFile('/modules/about.scss'));
gulp.task('compile-sass-home', () => compileFile('/modules/home.scss'));
gulp.task('compile-sass-auth', () => compileFile('/modules/auth.scss'));
gulp.task('compile-sass-cards', () => compileFile('/modules/cards.scss'));
gulp.task('compile-saas-waitingroom', () => compileFile('/modules/waitingroom.scss'));
gulp.task('compile-saas-deckselection', () => compileFile('/modules/deckselection.scss'));
gulp.task('compile-saas-navigation', () => compileFile('/modules/navigation.scss'));
gulp.task('compile-saas-tabletop', () => compileFile('/modules/tabletop.scss'));
gulp.task("compile-saas-tooltips", () => compileFile("/modules/ingame-draggable-tips.scss"));
gulp.task('compile-saas-mapview', () => compileFile('/modules/mapview.scss'));
gulp.task('compile-saas-gamearda', () => compileFile('/modules/game-arda.scss'));
gulp.task('compile-saas-helprules', () => compileFile('/modules/rules.scss'));
gulp.task('compile-saas-question', () => compileFile('/modules/question.scss'));


gulp.task('compile-saas-backgrounds', () => compileFile("/modules/backgrounds.scss"));
gulp.task('compile-saas-bootstrap', () => compileFile("/modules/bootstrap.scss"));
gulp.task('compile-saas-card-preview', () => compileFile("/modules/card-preview.scss"));
gulp.task('compile-saas-dropfile', () => compileFile("/modules/dropfile.scss"));
gulp.task('compile-saas-game-preferences', () => compileFile("/modules/game-preferences.scss"));
gulp.task('compile-saas-card-editor', () => compileFile("/modules/card-editor.scss"));
gulp.task('compile-saas-map-editor', () => compileFile("/modules/map-editor.scss"));
gulp.task('compile-saas-map-lobby', () => compileFile("/modules/lobby.scss"));


gulp.task('compile-saas-notification', () => compileFile('/modules/notification.scss'));
gulp.task("compile-saas-score", () => compileFile('/modules/score.scss'));

gulp.task('copy-client-js', () => {
    console.info("Building all client game JS files and saving to " + targetPathJs);
    return gulp.src("./src-client/game-client/**/*").pipe(gulp.dest(targetPathJs));
});

const sccsModules = [
    "compile-sass-about",
    "compile-sass-cards",
    "compile-sass-home",
    "compile-sass-auth",
    "compile-saas-waitingroom",
    "compile-saas-deckselection",
    "compile-saas-navigation",
    "compile-saas-notification",
    "compile-saas-tabletop",
    "compile-saas-tooltips",
    "compile-saas-score",
    "compile-saas-mapview",
    "compile-saas-gamearda",
    "compile-saas-helprules",
    "compile-saas-question"
]

const sccsModulesUnwatched = [
    'compile-saas-backgrounds',
    'compile-saas-bootstrap',
    'compile-saas-card-preview',
    'compile-saas-dropfile',
    'compile-saas-game-preferences',
    'compile-saas-card-editor',
    'compile-saas-map-editor',
    'compile-saas-map-lobby'
];


// 
// Task to watch changes
// 
gulp.task('watch-assets', () => {
    console.log("watch scss");
    gulp.watch(sourcePath + '/**/*.scss', gulp.series(sccsModules));

    console.log("watch js");
    gulp.watch("./src-client/game-client/**/*", gulp.series(["copy-client-js"]));
});

// Task to build assets
gulp.task('build-assets', gulp.series(sccsModules));
gulp.task('build-assets-unwatched', gulp.series(sccsModulesUnwatched));

// Default-Task
const vsArgs = isProd ? ["build-assets-unwatched", 'build-assets', "copy-client-js"] : ["build-assets-unwatched", 'build-assets',  'watch-assets']
gulp.task('default', gulp.series(vsArgs));