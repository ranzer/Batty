module.exports = function(config) {
  config.set({
    
    basePath: '',
    
    frameworks: [ 'mocha' ],
    
    client: {
      mocha: {
        ui: 'tdd'
      }
    },
    
    files: [
      'client/expect.js',
      '../public/js/modernizr.js',
      '../public/js/pixi.dev.js'
      { pattern: 'html/*.html', watched: false, served: true, included: false },
      { pattern: '../public/*.json', watched: false, served: true, included: false }
    ],
    
    preprocessors: {},
    
    exclude: [],
    
    reporters: [ 'dots', 'junit' ],
    
    junitReporters: {
      outputFile: 'results/lastResult.xml'
    },
    
    hostname: 'localhost',
    
    port: 9876,
    
    colors: true,
    
    logLevel: config.LOG_INFO,
    
    autoWatch: false,
    
    browsers: [ 'IE', 'Firefox', 'Chrome' ],
    
    captureTimeout: 60000,
    
    singleRun: true,
    
    plugins: [
      'karma-ie-launcher',
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-junit-reporter'
    ]
  });
};