var app = angular.module('tutor', ['google-maps'.ns()]);

app.controller('LearnController', ['$scope', function($scope) {

}]);

app.controller('MapController', ['$scope', function($scope) {
  $scope.map = {
    center: {
      latitude: 36.001869,
      longitude: -78.931487
    },
    zoom: 14
  };

  


}]);
