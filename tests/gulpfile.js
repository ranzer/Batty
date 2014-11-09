var gulp = require('gulp'),
    rimraf = require('gulp-rimraf'),
    karma = require('karma').server,
    merge = require('merge-stream');

gulp.task('remove-files', function() {
  return gulp.src(['lib/*.js', 'src/*.js', 'images/*.*', './SpriteSheet.json'], { read: false })
    .pipe(rimraf());
});

gulp.task('copy-files', function() {
  var jsSrc = gulp.src('../public/js/src/*.js')
    .pipe(gulp.dest('src'));
  var jsLib = gulp.src('../public/js/lib/*.js')
    .pipe(gulp.dest('lib'));
  var images = gulp.src('../public/images/SpriteSheet.png')
    .pipe(gulp.dest('images'));
  var json = gulp.src('../public/SpriteSheet.json')
    .pipe(gulp.dest('./'));
    
  return merge(jsSrc, jsLib, images, json);
});

gulp.task('set-environment-variables', function() {
  process.env.IE_BIN = 'C:\\Program Files\\Internet Explorer\\iexplore.exe';
  process.env.CHROME_BIN = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  process.env.FIREFOX_BIN = 'C:\\Program Files (x86)\\Utilities\\Mozilla Firefox\\firefox.exe';
});
    
gulp.task('run-tests', ['remove-files', 'copy-files', 'set-environment-variables'], function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});