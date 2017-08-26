homeApp.controller('WelshRankingsController', ['$scope', '$http', '$window', 'club', function($scope, $http, $window, club) {

	var getClub = club.getClub();
	getClub.then(function(clubName){
		
		$http.get('./data_generated/welsh_rankings/' + clubName + '/welsh_rankings.json')
			.success(function(data) {
				$scope.players = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	});
	
	$scope.direction = false;
	$scope.orderColumn = "playerRank";
	$scope.sort = function(column) {
		if ($scope.orderColumn === column) {
			$scope.direction = !$scope.direction;
		} else {
			$scope.orderColumn = column;
			$scope.direction = true;
		}
	};
	
	$scope.filter = {};
	
	$scope.getOptionsFor = function (propName) {
        return ($scope.players || []).map(function (f) {
            return f[propName];
        }).filter(function (f, idx, arr) {
            return arr.indexOf(f) === idx;
        });
    };
	
    $scope.filterByTeam = function (fixture) {
        // Use this snippet for matching with AND
        var matchesAND = true;
        for (var prop in $scope.filter) {
            if (noSubFilter($scope.filter[prop])) continue;
            if (!$scope.filter[prop][fixture[prop]]) {
                matchesAND = false;
                break;
            }
        }
        return matchesAND;	
	}
	
	$scope.clearFilter = function() {
		$scope.filter = {};
	}

	$scope.refreshData = function() {
		$window.location.href = '/reset?sourcePage=welsh_rankings';
	}

}]);