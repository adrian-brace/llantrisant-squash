homeApp.controller('AppearancesController', ['$scope', '$http', '$window', '$location', 'club', function($scope, $http, $window, $location, club) {
    
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

	var appearancesFileName = $scope.yearSelection + '-' + $scope.seasonSelection + '.json'
	var getClub = club.getClub();
	getClub.then(function(clubName){
		
		$http.get('./data_generated/appearances/' + clubName + '/' + appearancesFileName)
			.success(function(data) {
				$scope.players = data.filter(function(player){
					return !player.isRacketball;
				});
				$scope.racketballPlayers = data.filter(function(player){
					return player.isRacketball;;
				});
				console.log(data);

				$scope.uniqueTeams = function(players) {
					
					var uniqueTeamLetters = [];
					
					if(players){
						for(playerIndex = 0; playerIndex < players.length; playerIndex++){    
							if(uniqueTeamLetters.indexOf(players[playerIndex].team) === -1){
								uniqueTeamLetters.push(players[playerIndex].team);        
							}
						}	
					}
					
					return uniqueTeamLetters;
				}

				$scope.uniqueTeamsRacketball = function(racketballPlayers) {
					
					var uniqueTeamLetters = [];
					
					if(racketballPlayers){
						for(playerIndex = 0; playerIndex < racketballPlayers.length; playerIndex++){    
							if(uniqueTeamLetters.indexOf(racketballPlayers[playerIndex].team) === -1){
								uniqueTeamLetters.push(racketballPlayers[playerIndex].team);        
							}
						}	
					}
					
					return uniqueTeamLetters;
				}

				$scope.getOptionsFor = function (propName) {
					return ($scope.players || []).map(function (f) {
						return f[propName];
					}).filter(function (f, idx, arr) {
						return arr.indexOf(f) === idx;
					});
				};
			
				$scope.getOptionsForRacketball = function (propName) {
					return ($scope.racketballPlayers || []).map(function (f) {
						return f[propName];
					}).filter(function (f, idx, arr) {
						return arr.indexOf(f) === idx;
					});
				};

				$scope.getTotalPullUps = function (team){
					
					var pullUpCount = 0;
					
					for(playerIndex = 0; playerIndex < $scope.players.length; playerIndex++){
						
						var player = $scope.players[playerIndex];
						
						if(player.appearances){				
							
							for(appearanceIndex = 0; appearanceIndex < player.appearances.length; appearanceIndex++){ 
							
								var appearance = player.appearances[appearanceIndex];
							
								if((team === appearance.team || !team) && appearance.team < player.team){
									pullUpCount += 1;
								}
							}	
						}
					}
					
					return pullUpCount;
				}
				
				$scope.getTotalPullUpsRacketball = function (team){
					
					var pullUpCount = 0;
					
					for(playerIndex = 0; playerIndex < $scope.racketballPlayers.length; playerIndex++){
						
						var player = $scope.racketballPlayers[playerIndex];
						
						if(player.appearances){				
							
							for(appearanceIndex = 0; appearanceIndex < player.appearances.length; appearanceIndex++){ 
							
								var appearance = player.appearances[appearanceIndex];
							
								if((team === appearance.team || !team) && appearance.team < player.team){
									pullUpCount += 1;
								}
							}	
						}
					}
					
					return pullUpCount;
				}
				
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
	
	$scope.directionRacketball = false;
	$scope.orderColumnRacketball = "playerRank";
	$scope.sortRacketball = function(column) {
		if ($scope.orderColumnRacketball === column) {
			$scope.directionRacketball = !$scope.directionRacketball;
		} else {
			$scope.orderColumnRacketball = column;
			$scope.directionRacketball = true;
		}
	};

	$scope.teamAppearances = function(allAppearances, team) {
		var filteredAppearances = [];
		if(typeof allAppearances !== 'undefined'){
			for (var appearanceIndex = 0; appearanceIndex < allAppearances.length; appearanceIndex++) {
				var teamAppearance = allAppearances[appearanceIndex];
				if (teamAppearance.team === team) {
					filteredAppearances.push(teamAppearance);
				}
			}
		}
		return filteredAppearances.length;
	};
	
	$scope.teamAppearancesRacketball = function(allAppearances, team) {
		var filteredAppearances = [];
		if(typeof allAppearances !== 'undefined'){
			for (var appearanceIndex = 0; appearanceIndex < allAppearances.length; appearanceIndex++) {
				var teamAppearance = allAppearances[appearanceIndex];
				if (teamAppearance.team === team) {
					filteredAppearances.push(teamAppearance);
				}
			}
		}
		return filteredAppearances.length;
	};

	$scope.filter = {};

	$scope.filterRacketball = {};
	
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
	
    $scope.filterByTeamRacketball = function (racketballPlayer) {
        // Use this snippet for matching with AND
        var matchesAND = true;
        for (var prop in $scope.filterRacketball) {
            if (noSubFilter($scope.filterRacketball[prop])) continue;
            if (!$scope.filterRacketball[prop][racketballPlayer[prop]]) {
                matchesAND = false;
                break;
            }
        }
        return matchesAND;	
	}

	$scope.clearFilter = function() {
		$scope.filter = {};
	}

	$scope.clearFilterRacketball = function() {
		$scope.filterRacketball = {};
	}

	$scope.refreshData = function() {
		$window.location.href = '/reset?sourcePage=appearances&year=' + $scope.yearSelection +'&season=' + $scope.seasonSelection;
	}

	$scope.submit = function() {
		$window.location.href = '/appearances?year=' + $scope.yearSelection +'&season=' + $scope.seasonSelection;
	}

	$scope.capitalizedSeasonSelection = function() {
		return (!!$scope.seasonSelection) ? $scope.seasonSelection.charAt(0).toUpperCase() + $scope.seasonSelection.substr(1).toLowerCase() : '';
	}

	$scope.teamsThatCanPullUp = function (item) { 
		return item !== 'E' && item !== '2';
	};

}]);