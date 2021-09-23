var fs          = require('fs');
var _           = require('underscore');
var exphbs      = require('express-handlebars');
var express     = require('express');

////////////////////////////////////////////////////////////////////////////////
// Important Globals
////////////////////////////////////////////////////////////////////////////////
var app;
var server;
var db;
var renderer;

var setup = function() {
    setupApp();
    registerPaths();
    registerStatic();
    start();
}

var setupApp = function() {
    app = express();
    app.engine('html', exphbs({
        extname:    '.html',
        layout:     false,
        defaultLayout: null
    }));
    app.set('view engine', 'html');
}

var registerPaths = function() {
    app.get('/', function(req, res) {    
        console.log(req);      
        res.render('main',{})
    });

    app.get('/incoming', function(req, res) {
        console.log(req);
        res.status(200).end;
    })
}

var registerStatic = function() {
    app.use('/static/styles/', express.static(__dirname + '/views/styles/'));
}

var start = function() {
    server = app.listen(3000);
}

setup();
