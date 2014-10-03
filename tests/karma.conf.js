// Karma configuration
// Generated on Wed Oct 01 2014 11:50:02 GMT+0200 (Central Europe Daylight Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'requirejs'],

    client: {
      mocha: {
        ui: 'tdd'
      }
    },
    
    // list of files / patterns to load in the browser
    files: [
      { pattern: 'SpriteSheetTest.json', included: false },
      { pattern: 'lib/*.js', included: false },
      { pattern: 'src/*.js', included: false },
      { pattern: 'tests/*Spec.js', included: false },
      { pattern: 'images/*.*', included: false },
      'tests/expect.js',
      'tests/sinon.js',
      'test-main.js'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'junit'],
  
    junitReporter: {
      outputFile: 'results/LastResult.xml'
    },
    
    hostname: 'localhost',

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,
    
    plugins: [
      'karma-ie-launcher',
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      'karma-requirejs',
      'karma-mocha',
      'karma-junit-reporter'
    ]
  });
};
