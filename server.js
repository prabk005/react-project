// set up ===============================================================================================
// var fs = require('fs');
var path = require('path');                              //varaible takes a path
var express = require('express');
var app = express();                                     //creatce out app w/express
var bodyParser = require('body-parser');                 //pull information from HTML POST(express4)


// configuration ========================================================================================
// tell your web server what port to listen on
app.set('port', (process.env.PORT || 3000));
// set the static files location /public/img will be /img for users
app.use('/', express.static(path.join(__dirname, 'public')));
 // parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

// Additional middleware which will set headers that we need on each request.
app.use(function(req, res, next) {
    // Set permissive CORS header - this allows this server to be used only as
    // an API server in conjunction with something like webpack-dev-server.
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Disable caching so we'll always get the latest comments.
    res.setHeader('Cache-Control', 'no-cache');
    next();
});


// listen (start app with node server.js) ================================================================
app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});
