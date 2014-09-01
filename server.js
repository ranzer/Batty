var http = require("http"),
    connect = require("connect"),
    app = connect(),
    serveStatic = require("serve-static");
    
app.use(serveStatic(__dirname + "/public"));

http.createServer(app).listen(4000);