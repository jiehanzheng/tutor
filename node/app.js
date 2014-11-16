var app = require('express')();
var http = require('http');
var httpServer = http.Server(app);
var io = require('socket.io')(httpServer);
var debug = require('debug')('app');
var jwt = require('jsonwebtoken');
var redis = require('redis');
var _ = require('lodash');
var querystring = require('querystring');

// var redisSubscribeClient = redis.createClient();

app.get('/', function(req, res){
  res.send('<h1>Hello world</h1>');
});

httpServer.listen(8080, function(){
  console.log('listening on *:8080');
});

var sockets = {};

io.on('connection', function(socket) {
  debug('a user connected');

  sockets[socket.id] = socket;
  
  socket.on('authenticate', function(userIdentityJWT) {
    debug('authenticate');
    jwt.verify(userIdentityJWT, process.env['JWT_HACKDUKE14'], function(err, user) {
      debug(user);
      socket.user = user;
      socket.emit('authenticated', socket.user);
    });
  });

  socket.on('request tutor', function(course) {
    if (!socket.user) {
      return;
    }

    // queue currently online tutors
    var socketsForCourse = [];
    _.forEach(sockets, function (possibleSocket) {      
      if (!possibleSocket.user) {
        return;
      }

      if (!possibleSocket.user.tutor) {
        return;
      }

      if (!possibleSocket.user.courses) {
        return;
      }

      if (_.some(possibleSocket.user.courses, function(c) { return c == course })) {
        socketsForCourse.push(possibleSocket);
      }
    });

    // now let's ask
    var lastTutorAskedSocket = null;
    var askATutor = function() {
      if (lastTutorAskedSocket != null) {
        lastTutorAskedSocket.emit('offer expired', 'sorry you are too slow');
      }

      if (socketsForCourse.length == 0) {
        socket.emit('no tutors available');
        return;
      }

      var tutorSocket = socketsForCourse.splice(0, 1)[0];

      // TODO: take into consideration exact delays (rather than 2s)

      if (tutorSocket.disconnected) {
        return askATutor();
      }

      tutorSocket.emit('offer', {
        expiry: 20 /* seconds */,
        student: socket.user
      });
      var nextTutorTimer = setTimeout(askATutor, 22000);
      lastTutorAskedSocket = tutorSocket;
      
      tutorSocket.once('accept offer', function() {
        debug('accept offer');
        clearTimeout(nextTutorTimer);
        negotiateMeeting(/* student */socket, tutorSocket);
      });

      tutorSocket.once('decline offer', function() {
        debug('decline offer');
        clearTimeout(nextTutorTimer);
        askATutor();
      });
    };

    // now bootstrap the process by asking first tutor
    askATutor();
  });

  var negotiateMeeting = function(studentSocket, tutorSocket) {
    studentSocket.emit('negotiation start', /* isTutor */ false);
    tutorSocket.emit('negotiation start', /* isTutor */ true);

    studentSocket.on('new private message', function(messageText) {
      studentSocket.emit('new private message', {
        sender: 'Me',
        text: messageText
      });
      tutorSocket.emit('new private message', {
        sender: 'Student',
        text: messageText
      });
    });

    tutorSocket.on('new private message', function(messageText) {
      tutorSocket.emit('new private message', {
        sender: 'Me',
        text: messageText
      });
      studentSocket.emit('new private message', {
        sender: 'Tutor',
        text: messageText
      });
    });

    studentSocket.on('change place category', function(placeCategory) {
      tutorSocket.emit('change place category', placeCategory);
    });

    tutorSocket.on('change place category', function(placeCategory) {
      studentSocket.emit('change place category', placeCategory);
    });

    studentSocket.on('change place', function(place) {
      tutorSocket.emit('change place', place);
    });

    tutorSocket.on('change place', function(place) {
      studentSocket.emit('change place', place);
    });

    var startTime = null;
    tutorSocket.on('start tutoring', function() {
      startTime = Date.now();
      tutorSocket.emit('start tutoring', startTime);
      studentSocket.emit('start tutoring', startTime);
    });

    tutorSocket.on('end tutoring', function() {
      debug('end tutoring');
      var tutoringSessionClaim = {
        startTime: startTime,
        endTime: Date.now(),
        studentId: studentSocket.user.id,
        tutorId: tutorSocket.user.id
      };

      debug(tutoringSessionClaim);

      var token = jwt.sign(tutoringSessionClaim, process.env['JWT_HACKDUKE14']);

      // TODO: submit to server
      http.get({
        hostname: 'localhost',
        port: '3000',
        path: '/dispatch/record?' + querystring.stringify({ token: token }),
      }, function(response) {
        debug('posted to rails');
        tutorSocket.emit('end tutoring', token);
        studentSocket.emit('end tutoring', token);
      });
    });
  };

  socket.on('become tutor', function(coords) {
    if (!socket.user) {
      return;
    }

    socket.user.tutor = true;
    socket.user.coords = coords;

    debug('user wants to become tutor')
    debug(socket.user);

    // TODO: courses potentially doesn't exist
    _.forEach(socket.user.courses, function(course) {
      debug('broadcasting to ' + course + ' for addition');
      socket.to('tutor_by_course.' + course).emit('add tutor', socket.user);
    });
  });

  socket.on('list online tutors for course', function(course) {
    _.forEach(sockets, function (possibleSocket) {      
      if (!possibleSocket.user) {
        return;
      }

      if (!possibleSocket.user.tutor) {
        return;
      }

      if (!possibleSocket.user.courses) {
        return;
      }

      debug('checking if he/she teaches ' + course + ":");
      debug(possibleSocket.user.courses);

      if (_.some(possibleSocket.user.courses, function(c) { return c == course })) {
        debug('yes!')
        socket.emit('add tutor', possibleSocket.user);
      }
    });
  });

  socket.on('subscribe to tutor updates for course', function(course) {
    socket.join('tutor_by_course.' + course);
  });

  socket.on('disconnect', function() {
    if (socket.user) {
      if (socket.user.courses && socket.user.tutor) {
        _.forEach(socket.user.courses, function(course) {
          debug('broadcasting to ' + course + ' for removal');
          socket.to('tutor_by_course.' + course).emit('remove tutor', socket.user.id);
        });
      }
    }

    delete sockets[socket.id];
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
