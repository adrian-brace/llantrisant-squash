homeApp.controller('RankingsForTeamController', ['$scope', '$http', 'club', 'configuration', 'clubConfiguration', function($scope, $http, club, configuration, clubConfiguration) {

	var getClub = club.getClub();
	var getConfiguration = configuration.getConfiguration();
	var squashTeams = [];
	var racketballTeams = [];

	$scope.ranking_update_due = RANKING_UPDATE_DUE_HTML_FILE;
	$scope.challenge_rules = CHALLENGE_RULES_HTML_FILE;
	$scope.showRankingUpdateDue = showRankingUpdateDue();

	// Call the getClub service (Reads from HostName or Defaults to one in Master Config File)
	getClub.then(function(clubName){
		$scope.clubName = clubName;
	
		// Call the getConfiguration service (Reads in the Master Config XML file and converts to JSON)
		getConfiguration.then(function(configuration){
			$scope.configuration = configuration;
			$scope.season = getSeasonAndYearForRankings();
			$scope.year = getYear();			
			$scope.showProvisionalRankings = showProvisionalRankings();

			// Get the club's current season's team configuration
			var getClubSeasonConfiguration = clubConfiguration.getClubSeasonConfiguration(clubName);
			getClubSeasonConfiguration.then(function(clubSeasonConfiguration){
				$scope.clubSeasonConfiguration = clubSeasonConfiguration;
				$scope.lastUpdated = $scope.clubSeasonConfiguration.LASTUPDATED;

				var playerClubRank = 0;

				// Build the players
				for(var teamIndex = 0; teamIndex < $scope.clubSeasonConfiguration.SQUASH.TEAMS.TEAM.length; teamIndex++){

					var team = $scope.clubSeasonConfiguration.SQUASH.TEAMS.TEAM[teamIndex];
					var teamUrl = buildTeamUrl($scope.configuration.CONSTANTS.LEAGUEHOMEPAGE, $scope.configuration.CONSTANTS.TEAMURL, team.DIVISIONID, team.TEAMID, team.COMPETITIONID);
					var players = [];
					var playerTeamRank = 0;
					
					for(var playerIndex = 0; playerIndex < team.PLAYERS.PLAYER.length; playerIndex++){

						var player = team.PLAYERS.PLAYER[playerIndex];

						playerTeamRank++;
						playerClubRank++;

						players.push({
							name: player.name,
							teamRanking: playerTeamRank,
							clubRanking: playerClubRank,
							isCaptain: player.iscaptain,
							refereeNumber: player.refereenumber,
							actualTeam: player.actualteam,
							isSpaceSaver: player.isspacesaver
						});
					}

					squashTeams.push({
							teamUrl: teamUrl,
							divisionName: team.DIVISIONNAME,
							teamName: team.NAME,
							homeNight: team.HOMENIGHT,
							teamNumber: teamIndex,
							players: players
						});
				}

				$scope.squashTeams = squashTeams;
				playerClubRank = 0;

				// Build the players
				if ($scope.clubSeasonConfiguration.RACKETBALL) {
					for(var teamIndex = 0; teamIndex < $scope.clubSeasonConfiguration.RACKETBALL.TEAMS.TEAM.length; teamIndex++){

						var team = $scope.clubSeasonConfiguration.RACKETBALL.TEAMS.TEAM[teamIndex];
						var teamUrl = buildTeamUrl($scope.configuration.CONSTANTS.LEAGUEHOMEPAGE, $scope.configuration.CONSTANTS.TEAMURL, team.DIVISIONID, team.TEAMID, team.COMPETITIONID);
						var players = [];
						var playerTeamRank = 0;
						
						for(var playerIndex = 0; playerIndex < team.PLAYERS.PLAYER.length; playerIndex++){

							var player = team.PLAYERS.PLAYER[playerIndex];

							playerTeamRank++;
							playerClubRank++;

							players.push({
								name: player.name,
								teamRanking: playerTeamRank,
								clubRanking: playerClubRank,
								isCaptain: player.iscaptain,
								refereeNumber: player.refereenumber,
								actualTeam: player.actualteam,
								isSpaceSaver: player.isspacesaver
							});
						}

						racketballTeams.push({
								teamUrl: teamUrl,
								divisionName: team.DIVISIONNAME,
								teamName: team.NAME,
								homeNight: team.HOMENIGHT,
								teamNumber: teamIndex,
								players: players
							});
					}
				}

				$scope.racketballTeams = racketballTeams;
			});
		});
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