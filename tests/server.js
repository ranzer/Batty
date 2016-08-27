var http = require('http'),
    connect = require('connect'),
    app = connect(),
    serveStatic = require('serve-static'),
    path = require('path'),
    url = require('url'),
    fs = require('fs');
    
app.use(serveStatic(__dirname + '/../public'));
app.use('/levels/', function(req, res, next) {
  var levelId = req.url.substring(1),
      filePath;
  
  if (!isNaN(levelId)) {
    filePath = __dirname + path.sep + '/../public/levels/' + levelId + '.json';
    
    fs.readFile(filePath, 'utf8', function(err, data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
      return;
    });
  }
});

http.createServer(app).listen(4000);