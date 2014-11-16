var app = angular.module('tutor', ['google-maps'.ns()]);

app.controller('NegotiationController', ['$scope', function($scope) {
  $scope.negotiating = false;
  $scope.chatMessages = [{ 
    sender: 'System', text: 'Please say hi to each other and negotiate a meeting place!' }];


}]);

app.controller('TeachController', ['$scope', function($scope) {
  var socket = io('http://localhost:8080');
  socket.emit('authenticate', window.userIdentityJWT);
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

  };

  $scope.declineOffer = function() {

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

  var apiProxy = 'http://localhost:8080/duke_api/';

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
      .error(function() {
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
