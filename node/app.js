var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var debug = require('debug')('app');
var jwt = require('jsonwebtoken');
var redis = require('redis');
var _ = require('lodash');

// var redisSubscribeClient = redis.createClient();

app.get('/', function(req, res){
  res.send('<h1>Hello world</h1>');
});

http.listen(8080, function(){
  console.log('listening on *:8080');
});

var sockets = {};

io.on('connection', function(socket) {
  debug('a user connected');

  console.log("socket.id = " + socket.id);
  sockets[socket.id] = { socket: socket };
  
  socket.on('authenticate', function(userIdentityJWT) {
    debug('authenticate');
    jwt.verify(userIdentityJWT, process.env['JWT_HACKDUKE14'], function(err, user) {
      debug(user);
      socket.user = user;
      socket.emit('authenticated', socket.user);
    });
  });

  socket.on('become tutor', function(coords) {
    if (!socket.user) {
      return;
    }

    socket.user.tutor = true;
    socket.user.coords = coords;

    // TODO: subject potentially doesn't exist
    for (var subject : socket.user.subjects) {
      socket.to('tutor_by_subject.' + subject).emit('add tutor', notification);
    }
  });

  socket.on('list online tutors for course', function(course) {
    for (var socket : sockets) {
      if (socket.user == null) {
        continue;
      }

      if (socket.user.tutor == null || !socket.user.tutor) {
        continue;
      }

      if (socket.user.subjects == null || !socket.user.subjects)

      if (_.some(socket.user.subjects, function(s) { s == course })) {
        socket.emit('add tutor', socket.user);
      }
    }
  });

  socket.on('subscribe to tutor updates for course', function(course) {

  });

  socket.on('disconnect', function() {

  });
});

// redisSubscribeClient.psubscribe("__keyspace@*__:tutors:*");
// redisSubscribeClient.on("pmessage", function(channel, event, message) {
//   debug(event);
//   var key = event.substring(event.indexOf(':') + 1);

//   if (message == 'set') {
//     redisClient.get(key, function(err, json) {
//       var tutor = JSON.parse(json);
//       console.log(tutor);
//       io.to(tutor.channel).emit('add tutor', tutor);
//     });
//   }
// });

// api proxy
var dukeAPIProxy = require('./routes/duke_api');
app.use('/duke_api', dukeAPIProxy);
