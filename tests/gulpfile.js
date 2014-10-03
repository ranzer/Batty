var gulp = require('gulp'),
    rimraf = require('gulp-rimraf'),
    karma = require('karma').server;

gulp.task('remove-files', function() {
  gulp.src(['lib/*.js', 'src/*.js', 'images/*.*', './SpriteSheet.json'], { read: false })
    .pipe(rimraf());
});
    
gulp.task('copy-files', function() {
  gulp.src('../public/js/lib/*.js')
    .pipe(gulp.dest('lib'));
  gulp.src('../public/js/src/*.js')
    .pipe(gulp.dest('src'));
  gulp.src('../public/images/SpriteSheet.png')
    .pipe(gulp.dest('images'));
  gulp.src('../public/SpriteSheet.json')
    .pipe(gulp.dest('./'));
});

gulp.task('set-environment-variables', function() {
  process.env.IE_BIN = 'C:\\Program Files\\Internet Explorer\\iexplore.exe';
  process.env.CHROME_BIN = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  process.env.FIREFOX_BIN = 'C:\\Program Files (x86)\\Utilities\\Mozilla Firefox\\firefox.exe';
});
    
gulp.task('run-tests', ['remove-files', 'copy-files', 'set-environment-variables'], function() {
 /* karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  });*/
});