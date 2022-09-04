homeApp.controller('RankingsController', ['$scope', '$http', '$window', '$location', 'xmlToJson', 'configuration', 'club', function($scope, $http, $window, $location, xmlToJson, configuration, club) {
    
	// Setup the current year and the years that are supported for the drop down list
	var today = new Date();

	var yearsFromQueryString = $location.absUrl().match(/year=(.*)&/);
	var seasonsFromQueryString = $location.absUrl().match(/season=(.*)/);
	
	var yearFromQueryString;
	var seasonFromQueryString;
	
	if(yearsFromQueryString !== null && yearsFromQueryString.length > 0){
		yearFromQueryString = yearsFromQueryString[1];
		console.log('yearFromQueryString: ' + yearFromQueryString);
	}

	if(seasonsFromQueryString !== null && seasonsFromQueryString.length > 0){
		seasonFromQueryString = seasonsFromQueryString[1];
		console.log('seasonFromQueryString: ' + seasonFromQueryString);
	}
	
	$scope.years = [];
	$scope.ranking_update_due = RANKING_UPDATE_DUE_HTML_FILE;
	$scope.showProvisionalRankings = showProvisionalRankings();

	for(supportedYear = getYear(); supportedYear >= OLDEST_YEAR; supportedYear--) {
		$scope.years.push(supportedYear);
	}
	
	if (!isNaN(yearFromQueryString)){
		$scope.yearSelection = parseInt(yearFromQueryString);
	} else {
		$scope.yearSelection = today.getFullYear();
	}

	// Build the seasons
	var springStart = new Date($scope.yearSelection + SPRING_START_MONTH);
	var winterStart = new Date($scope.yearSelection + WINTER_START_MONTH);
	$scope.seasons = [];
	
	if (seasonFromQueryString == SEASON_SPRING || seasonFromQueryString == SEASON_WINTER){
		$scope.seasonSelection = seasonFromQueryString;
	} else {
		if (today < springStart || today > winterStart){
			$scope.seasonSelection = SEASON_WINTER;
		} else {
			$scope.seasonSelection = SEASON_SPRING;
		}
	}

	$scope.seasons.push(SEASON_SPRING);
	$scope.seasons.push(SEASON_WINTER);
	
	//console.log($scope.seasons.length);
	
	// when landing on the page, load config data and the rankings data into scope
	
	var getConfiguration = configuration.getConfiguration();
	
	// Call the getConfiguration service (Reads in the Master Config XML file and converts to JSON)
	getConfiguration.then(function(configuration){
		$scope.configuration = configuration;
	});
		
	var rankingsFileName = $scope.yearSelection + '-' + $scope.seasonSelection + '.json'
    
	var getClub = club.getClub();
	getClub.then(function(clubName){
		
		$http.get('./data_generated/appearances/' + clubName + '/' + rankingsFileName)
			.success(function(data) {
				$scope.allRankings = data.filter(function(player){
					return !player.isRacketball;
				});
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	});
	
	$scope.direction = false;
	$scope.orderColumn = "currentRankingPosition";
	$scope.sort = function(column) {
		if ($scope.orderColumn === column) {
			$scope.direction = !$scope.direction;
		} else {
			$scope.orderColumn = column;
			$scope.direction = true;
		}
	};
	
	$scope.submit = function() {
		$window.location.href = '/rankings?year=' + $scope.yearSelection +'&season=' + $scope.seasonSelection;
	}
	
	$scope.filter = {};
	
	$scope.getOptionsFor = function (propName) {
        return ($scope.allRankings || []).map(function (f) {
            return f[propName];
        }).filter(function (f, idx, arr) {
            return arr.indexOf(f) === idx;
        });
    };
	
    $scope.filterByTeam = function (player) {
        // Use this snippet for matching with AND
        var matchesAND = true;
        for (var prop in $scope.filter) {
            if (noSubFilter($scope.filter[prop])) continue;
            if (!$scope.filter[prop][player[prop]]) {
                matchesAND = false;
                break;
            }
        }
        return matchesAND;	
	}
	
	$scope.clearFilter = function() {
		$scope.filter = {};
	}
	
	$scope.showMatches = true;
	$scope.showGames = false;
	$scope.showPoints = false;
	
	$scope.refreshData = function() {
		$window.location.href = '/reset?sourcePage=rankings&year=' + $scope.yearSelection +'&season=' + $scope.seasonSelection;
	}

	$scope.capitalizedSeasonSelection = function() {
		return (!!$scope.seasonSelection) ? $scope.seasonSelection.charAt(0).toUpperCase() + $scope.seasonSelection.substr(1).toLowerCase() : '';
	}

}]);