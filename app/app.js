var fs          = require('fs');
var _           = require('underscore');
var exphbs      = require('express-handlebars');
var express     = require('express');
var twilio      = require('twilio');

////////////////////////////////////////////////////////////////////////////////
// ENV Setup
////////////////////////////////////////////////////////////////////////////////
require('dotenv').config()

////////////////////////////////////////////////////////////////////////////////
// Important Globals
////////////////////////////////////////////////////////////////////////////////
var app;
var server;
var db;
var renderer;

var whitelist = [
    '+16789975091',
    '+17345469219'
]

var twilio_client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)

////////////////////////////////////////////////////////////////////////////////
// Main
////////////////////////////////////////////////////////////////////////////////

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
        
        var message = fs.readFileSync(__dirname + '/msg.txt', 'utf8');
        var here = fs.readFileSync(__dirname + '/status.txt', 'utf8') == 'h'


        console.log(req);   
        res.render('main',{
            here: here,
            message: message,
            message_exists: message.length > 0
        })
    });

    app.get('/incoming', function(req, res) {

        if(! (_.has(req.query, 'From') && _.has(req.query, 'Body'))) {
            console.log("didn't get what I needed")
            res.status(200).end()
            return;
        }

        var from_number = req.query.From;
        var body = req.query.Body;
        body.trim();

        console.log(from_number, body)

        // make sure it's from a number in our whitelist
        if(_.contains(whitelist, from_number)) {
            // check the message
            // looking for... (here) or (gone | away)
            // can also give "message:<some message>"
            // can also give "help"
            if(body == 'help') {
                twilio_client.messages.create({        
                    messagingServiceSid: process.env.TWILIO_MSG_SID, 
                    to: from_number,
                    body: 'Say "here" or "away", or "msg:<your message>"'
                }).done();
                res.status(200).end();
                return;
            }

            if(body.toLowerCase() == 'here') {
                fs.writeFileSync(__dirname + '/status.txt', 'h');
                twilio_client.messages.create({        
                    messagingServiceSid: process.env.TWILIO_MSG_SID, 
                    to: from_number,
                    body: 'Howdy! Enjoy your stay!'
                }).done();
                res.status(200).end();
                return;
            }

            if(body.toLowerCase() == 'away') {
                fs.writeFileSync(__dirname + '/status.txt', 'a');
                twilio_client.messages.create({        
                    messagingServiceSid: process.env.TWILIO_MSG_SID, 
                    to: from_number,
                    body: 'See you next time!'
                }).done();
                res.status(200).end();
                return;
            }

            if(body.toLowerCase().startsWith('msg:')) {
                fs.writeFileSync(__dirname + '/msg.txt', body.substring(4))
                twilio_client.messages.create({        
                    messagingServiceSid: process.env.TWILIO_MSG_SID, 
                    to: from_number,
                    body: 'Got it, loud and clear!'
                }).done();
                res.status(200).end();
                return;
            }

            // if we got here then we didn't do something!
            twilio_client.messages.create({        
                messagingServiceSid: process.env.TWILIO_MSG_SID, 
                to: from_number,
                body: 'Hmm, didn\'t get that! Say "help" for help.'
            }).done();
            
        } else {
            twilio_client.messages.create({        
                messagingServiceSid: process.env.TWILIO_MSG_SID, 
                to: from_number,
                body: 'Sorry, there\'s only one David, and it\'s not you. Better luck in your next life!'
            }).done();
            res.status(200).end();
        }
        
    })
}

var registerStatic = function() {
    app.use('/static/styles/', express.static(__dirname + '/views/styles/'));
}

var start = function() {
    server = app.listen(3000);
}

setup();
