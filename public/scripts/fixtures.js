homeApp.controller('FixturesController', ['$scope', '$http', 'club', function($scope, $http, club) {
    
	$scope.header = './public/header.html';

	$scope.year = getYear();
	$scope.season = getSeason();
	
	var getClub = club.getClub();
	getClub.then(function(clubName){
		
		$http.get('./data_generated/fixtures/' + clubName + '/fixtures.json')
			.success(function(data) {
				$scope.fixtures = fixturesOnly(data);
				$scope.results = resultsOnly(data);
				console.log(data);
				
				$scope.getOptionsFor = function (propName, isFixtures) {
					
					var data;
					
					if (isFixtures){
						data = $scope.fixtures;
					}else{
						data = $scope.results;
					}
					
					return (data || []).map(function (f) {
						return f[propName];
					}).filter(function (f, idx, arr) {
						return arr.indexOf(f) === idx;
					});
				};
				
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	});
	
	$scope.direction = false;
	$scope.orderColumn = "date";
	$scope.sort = function(column) {
		if ($scope.orderColumn === column) {
			$scope.direction = !$scope.direction;
		} else {
			$scope.orderColumn = column;
			$scope.direction = true;
		}
	};
	
	$scope.filter = {};
	
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
}]);