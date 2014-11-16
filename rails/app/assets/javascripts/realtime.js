var app = angular.module('tutor', ['google-maps'.ns()]);

var apiProxy = 'http://localhost:8080/duke_api/';

app.controller('SessionController', ['$scope', '$http', '$interval', '$location', function($scope, $http, $interval, $location) {
  $scope.inProgress = false;
  $scope.startTime = null;
  $scope.isTutor = false;

  $scope.timeElapsed = "00:00:00";

  $scope.socket.on('start tutoring', function(state) {
    $scope.$apply(function() {
      $scope.inProgress = true;
      $scope.startTime = state.startTime;
      $scope.isTutor = state.isTutor;
      $("#session_modal").modal({
        backdrop: 'static'
      });
      
    });

    $interval(function() {
      var secondsElapsed = (Date.now() - $scope.startTime) / 1000;
      var hours = parseInt( secondsElapsed / 3600 ) % 24;
      var minutes = parseInt( secondsElapsed / 60 ) % 60;
      var seconds = parseInt(secondsElapsed % 60, 10);
      $scope.timeElapsed = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);
    }, 1000);
  });

  $scope.endTutoring = function() {
    $scope.socket.emit('end tutoring');
  };

  $scope.socket.on('end tutoring', function(token) {
    $scope.$apply(function() {
      $scope.inProgress = false;
      window.location.reload();
    });
  });
}]);

app.controller('NegotiationController', ['$scope', '$http', function($scope, $http) {
  $scope.negotiating = false;
  $scope.isTutor = false;
  $scope.chatMessages = [{ 
    sender: 'System', text: 'Please say hi to each other and negotiate a meeting place!' }];

  $scope.socket.on('negotiation start', function(isTutor) {
    $scope.$apply(function() {
      $scope.negotiating = true;
      $scope.isTutor = isTutor;
      $('#negotiation_modal').modal({
        backdrop: 'static'
      });
    });
  });

  $scope.messageDraft = "Hello, nice to meet you!";

  $scope.sendMessage = function() {
    $scope.socket.emit('new private message', $scope.messageDraft);
    $scope.messageDraft = "";
  };

  $scope.socket.on('new private message', function(chatMessage) {
    $scope.$apply(function() {
      $scope.chatMessages.push(chatMessage);
    });
  });

  // categories flattened to just one level
  $scope.placeCategory = {}; 
  $scope.place = {};

  $scope.placeCategories = [];
  $scope.places = [];

  // load places category
  $http.get(apiProxy + 'places/categories')
    .success(function(nestedCategories) {
      var flattenedCategories = [];

      var flatten = function(nestedCategories, category, namePrefix) {
        var name = (namePrefix.length > 0 ? namePrefix + ' - ' : "") + nestedCategories.category;

        flattenedCategories.push({
          name: name,
          category: category,
          catId: nestedCategories.cat_id
        });

        if (nestedCategories.no_child_cats) {
          return;
        }

        _.forEach(nestedCategories.children, function(nestedCategories) {
          flatten(nestedCategories, category, name);
        });
      };

      _.forEach(nestedCategories, function(firstLevelCategory) {
        flatten(firstLevelCategory, firstLevelCategory.category, "");
      });

      $scope.placeCategories = flattenedCategories;
    });

  $scope.updatePlaces = function() {
    $scope.places = [];

    if (_.size($scope.placeCategory) == 0) {
      return;
    }

    // WTF??  THIS MAKES NO FREAKING SENSE...
    var lookupTag = $scope.placeCategory.catId.replace(/^.*%2C/, '');

    $http.get(apiProxy + 'places/items?tag=' + encodeURIComponent(lookupTag))
      .success(function(data) {
        console.log(data);
        try {
          $scope.places = data;
        } catch (err) {
          console.error(err);
        }
      })
      .error(function(data) {
        console.error('places fetch error');
        console.error(data);
      });
  };

  $scope.$watch('placeCategory', function(newValue, oldValue) {
    $scope.updatePlaces();
  });

  $scope.pushPlaceCategoryUpdate = function() {
    $scope.socket.emit('change place category', $scope.placeCategory);
  };

  $scope.pushPlaceUpdate = function() {
    $scope.socket.emit('change place', $scope.place);
  };

  $scope.socket.on('change place category', function(placeCategory) {
    $scope.$apply(function() {
      $scope.placeCategory = placeCategory;
    });
  });

  $scope.socket.on('change place', function(place) {
    $scope.$apply(function() {
      $scope.place = place;
    });
  });

  $scope.startTutoring = function() {
    $scope.socket.emit('start tutoring');
  };

  $scope.socket.on('start tutoring', function() {
    $('#negotiation_modal').modal('hide');
  });

}]);

app.controller('TeachController', ['$scope', function($scope) {
  var socket = io('http://localhost:8080');
  socket.emit('authenticate', window.userIdentityJWT);

  // TODO: real lat/lng

  socket.emit('become tutor', { latitude: 36.001869, longitude: -78.931487 });

  // TODO: deal with multiple offers
  $scope.socket = socket;

  $scope.pendingOffer = null;

  socket.on('offer', function(offer) {
    $scope.$apply(function() {
      $scope.pendingOffer = offer;
    });
  });

  socket.on('offer expired', function() {

  });

  $scope.acceptOffer = function() {
    socket.emit('accept offer');
    $scope.pendingOffer = null;
  };

  $scope.declineOffer = function() {
    socket.emit('decline offer');
    $scope.pendingOffer = null;
  };

}]);

app.controller('LearnController', ['$scope', '$http', function($scope, $http) {
  $scope.selectedCourse = null;

  $scope.subjectCode = "COMPSCI";
  $scope.courseNumber = "201";

  $scope.subjects = [];
  $scope.courses = [];

  // mapCtrl will read this
  $scope.tutors = [];

  var socket = io('http://localhost:8080');
  socket.emit('authenticate', window.userIdentityJWT);

  $scope.socket = socket;

  this.socketAuthenticated = false;
  socket.on('authenticated', function(user) {
    console.log('we are authenticated as:');
    console.log(user);
    this.socketAuthenticated = true;
  });

  // load subjects
  $http.get(apiProxy + 'curriculum/list_of_values/fieldname/SUBJECT')
    .success(function(data, status, headers, config) {
      $scope.subjects = data.scc_lov_resp.lovs.lov.values.value;
    })
    .error(function(data, status, headers, config) {
      console.error('load subjects error');
      console.error(data);
    });

  $scope.updateCourseNumbers = function() {
    $scope.courses = [];

    if ($scope.subjectCode == null || $scope.subjectCode.length == 0) {
      return;
    }

    $http.get(apiProxy + '/curriculum/courses/subject/' + encodeURIComponent($scope.subjectCode))
      .success(function(data) {
        try {
          $scope.courses = data.ssr_get_courses_resp.course_search_result.subjects.subject.course_summaries.course_summary;
        } catch (err) {
          console.error(err);
        }
      })
      .error(function(data) {
        console.error('course number error');
        console.error(data);
      });
  };

  $scope.updateCourseNumbers();

  $scope.showTutors = function() {
    if ($scope.subjectCode.length == 0 || $scope.courseNumber.length == 0) {
      return;
    }

    $scope.selectedCourse = $scope.subjectCode + ' ' + $scope.courseNumber;

    socket.emit('subscribe to tutor updates for course', $scope.selectedCourse);
    socket.emit('list online tutors for course', $scope.selectedCourse);
  };

  $scope.requestTutor = function() {
    socket.emit('request tutor', $scope.selectedCourse);
  };

  socket.on('add tutor', function(tutor) {
    console.debug('add tutor')
    $scope.$apply(function() {
      $scope.tutors.push(tutor);
    });
  });

  socket.on('remove tutor', function(tutorId) {
    console.debug('remove tutor')
    $scope.$apply(function() {
      _.remove($scope.tutors, function(tutor) {
        return tutor.id == tutorId;
      });
    });
  });

  socket.on('no tutors available', function() {
    console.debug('no tutors available');
    alert('We are sorry, but no tutors are able to provide service at this time.');
  });
}]);

app.controller('MapController', ['$scope', function($scope) {
  $scope.map = {
    center: {
      latitude: 36.001869,
      longitude: -78.931487
    },
    zoom: 14
  };

  // $scope.tutors


}]);
