homeApp.controller('TeamStandingsController', ['$scope', '$http', '$sce', 'club', function($scope, $http, $sce, club) {
    
	$scope.header = './public/header.html';

	$scope.year = getYear();
	$scope.season = getSeason();
	
	var getClub = club.getClub();
	getClub.then(function(clubName){
		
		$http.get('./data_generated/team_standings/' + clubName + '/team_standings.json')
			.success(function(data) {
				$scope.teams = data;

				/*for (var i = 0; i < $scope.teams.length; i++) {
					$scope.teams[i].html = $sce.trustAsHtml($scope.teams[i].html.replaceAll("/images/icons/","/public/images/icons/"));
				}*/

				$scope.getOptionsFor = function (propName) {
					
					var data = $scope.teams;
					
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
	
	$scope.filter = {};
	
    $scope.filterByTeam = function (team) {
        // Use this snippet for matching with AND
        var matchesAND = true;
        for (var prop in $scope.filter) {
            if (noSubFilter($scope.filter[prop])) continue;
            if (!$scope.filter[prop][team[prop]]) {
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