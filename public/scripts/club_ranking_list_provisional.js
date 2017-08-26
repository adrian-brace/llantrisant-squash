homeApp.controller('ProvisionalRankingsController', ['$scope', '$http', 'club', 'configuration', 'clubConfiguration', function($scope, $http, club, configuration, clubConfiguration) {

	var getClub = club.getClub();
	var getConfiguration = configuration.getConfiguration();
	
	$scope.challenge_rules = CHALLENGE_RULES_HTML_FILE;

	var getClub = club.getClub();
	$scope.year = getYear();
	getClub.then(function(clubName){
		
		$http.get('./configuration/'+ clubName + '/' + $scope.year + '-summer-provisional.json')
			.success(function(data) {
				$scope.data = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	});

	// Call the getClub service (Reads from HostName or Defaults to one in Master Config File)
	getClub.then(function(clubName){
		$scope.clubName = clubName;
	});
	
	$scope.showChallengeRules = false;
	
	$scope.showHideRules = function(){
		if ($scope.showChallengeRules){
			$scope.showChallengeRules = false;
		}
		else{
			$scope.showChallengeRules = true;
		}
	}
	
}]);