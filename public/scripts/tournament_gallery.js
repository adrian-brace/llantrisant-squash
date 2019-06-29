homeApp.controller('TournamentGalleryController', ['$scope', function($scope) {

  $scope.title = "Gallery";

  $scope.images = [{
    "image": "./public/images/Llantrisant/TournamentGallery/Llantrisant Open 2017 024.JPG"
  },
  {
      "image": "./public/images/Llantrisant/TournamentGallery/Llantrisant Open 2017 034.JPG"
    },
    {
      "image": "./public/images/Llantrisant/TournamentGallery/Open 2017 013.JPG"
  }];
}]);

homeApp.directive('slider', function () {
  return {
    restrict: 'EA',
    scope: {
      title: '=title',
      images: '=images',
      group: '=group'
    },
    controller: function ($scope) {
      $scope.title = $scope.title;
      $scope.group = $scope.group || 1;
      $scope.currentIndex = 0;
      $scope.direction = 'left';

      var init = function () {
        var images = [];
        var source = [];

        angular.copy($scope.images, source);

        for (var i = 0; i < source.length; i + $scope.group) {
          if (source[i]) {
            images.push(source.splice(i, $scope.group));
          }
        }
        $scope.setCurrent(0);
        $scope.slides = images;
      };

      $scope.$watch('group', init);

      $scope.setCurrent = function (index) {
        $scope.direction = (index > $scope.currentIndex) ? 'left' : 'right';
        $scope.currentIndex = index;
      };

      $scope.isCurrent = function (index) {
        return $scope.currentIndex === index;
      };

      $scope.next = function () {
        $scope.direction = 'left';
        $scope.currentIndex = $scope.currentIndex < $scope.slides.length-1 ? ++$scope.currentIndex : 0;
      };

      $scope.prev = function () {
        $scope.direction = 'right';
        $scope.currentIndex = $scope.currentIndex > 0 ? --$scope.currentIndex : $scope.slides.length-1;
      };
    },
    templateUrl: "public/slider.html",

    link: function (scope, element, attrs) {
      scope.$watch('currentIndex', function (value, previousValue) {
        console.log(value, previousValue);

      });
    }
  };
});

homeApp.animation('.slide-animation', function () {
  return {
    beforeAddClass: function (element, className, done) {
      var scope = element.scope();

      if (className === 'ng-hide') {
        var finishPoint = element.parent().width();
        if(scope.direction !== 'right') {
          finishPoint = -finishPoint;
        }
      } else {
        done();
      }
    },
    removeClass: function (element, className, done) {
      var scope = element.scope();

      if (className === 'ng-hide') {
        element.removeClass('ng-hide');

        var startPoint = element.parent().width();
        if(scope.direction === 'right') {
          startPoint = -startPoint;
        }
      } else {
        done();
      }
    }
  };
});