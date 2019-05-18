var homeApp = angular.module('homeApp', ['ngRoute']);

// configure our routes
homeApp.config(function($routeProvider) {
	
	$routeProvider
		.when('/', {
			templateUrl : 'public/home.html',
			controller  : 'HomeController'
		})
		.when('/about_us', {
			templateUrl : 'public/about_us.html',
			controller  : 'HomeController'
		})
		.when('/android', {
			templateUrl : 'public/android.html',
			controller  : 'HomeController'
		})
		.when('/appearances', {
			templateUrl : 'public/appearances.html',
			controller  : 'AppearancesController'
		})
		.when('/archived_team_results', {
			templateUrl : 'public/archived_team_results.html',
			controller  : 'HomeController'
		})
		.when('/coaching', {
			templateUrl : 'public/coaching.html',
			controller  : 'HomeController'
		})
		.when('/contact_us', {
			templateUrl : 'public/contact_us.html',
			controller  : 'HomeController'
		})
		.when('/find_us', {
			templateUrl : 'public/find_us.html',
			controller  : 'HomeController'
		})
		.when('/fixtures', {
			templateUrl : 'public/fixtures.html',
			controller  : 'FixturesController'
		})
		.when('/ladders', {
			templateUrl : 'public/ladders.html',
			controller  : 'LaddersController'
		})
		.when('/rankings', {
			templateUrl : 'public/rankings.html',
			controller  : 'RankingsController'
		})
		.when('/club_ranking_list', {
			templateUrl : 'public/club_ranking_list.html',
			controller  : 'RankingsForTeamController'
		})
		.when('/club_ranking_list_provisional', {
			templateUrl : 'public/club_ranking_list_provisional.html',
			controller  : 'ProvisionalRankingsController'
		})
		.when('/reset', {
			templateUrl : 'public/reset.html',
			controller  : 'HomeController'
		})
		.when('/ladder_updated', {
			templateUrl : 'public/ladder_updated.html',
			controller  : 'HomeController'
		})
		.when('/links', {
			templateUrl : 'public/links.html',
			controller  : 'HomeController'
		})
		.when('/results', {
			templateUrl : 'public/results.html',
			controller  : 'FixturesController'
		})
		.when('/social_media', {
			templateUrl : 'public/social_media.html',
			controller  : 'HomeController'
		})
		.when('/sponsors', {
			templateUrl : 'public/sponsors.html',
			controller  : 'HomeController'
		})
		.when('/team_standings', {
			templateUrl : 'public/team_standings.html',
			controller  : 'TeamStandingsController'
		})
		.when('/tournament_details', {
			templateUrl : 'public/tournament_details.html',
			controller  : 'HomeController'
		})
		.when('/tournament_prize_money', {
			templateUrl : 'public/tournament_prize_money.html',
			controller  : 'HomeController'
		})
		.when('/tournament_draw', {
			templateUrl : 'public/tournament_draw.html',
			controller  : 'HomeController'
		})
		.when('/tournament_faqs', {
			templateUrl : 'public/tournament_faqs.html',
			controller  : 'HomeController'
		})
		.when('/tournament_history', {
			templateUrl : 'public/tournament_history.html',
			controller  : 'TournamentController'
		})
		.when('/tournament_gallery', {
			templateUrl : 'public/tournament_gallery.html',
			controller  : 'TournamentGalleryController'
		})
		.when('/under_construction', {
			templateUrl : 'public/under_construction.html',
			controller  : 'HomeControllerController'
		})
		.when('/welsh_rankings', {
			templateUrl : 'public/welsh_rankings.html',
			controller  : 'WelshRankingsController'
		});
});

homeApp.controller('HomeController', ['$scope', '$http','$location','$anchorScroll', 'xmlToJson', 'club', 'configuration', 'clubConfiguration',  function($scope, $http, $location, $anchorScroll, xmlToJson, club, configuration, clubConfiguration) {
    
	$scope.scrollTo = function(id) {
		var old = $location.hash();
		$location.hash(id);
		$anchorScroll();
		//reset to old to keep any additional routing logic from kicking in
		$location.hash(old);
   }

	$scope.header = HEADER_HTML_FILE;
	$scope.tournament_title = TOURNAMENT_TITLE_HTML_FILE;
	$scope.tournament_header = TOURNAMENT_HEADER_HTML_FILE;
	$scope.tournament_over = TOURNAMENT_OVER_HTML_FILE;
	$scope.tournament_results_available = TOURNAMENT_RESULTS_AVAILABLE_HTML_FILE;
	$scope.tournament_footer = TOURNAMENT_FOOTER_HTML_FILE;

	var getClub = club.getClub();
	var getConfiguration = configuration.getConfiguration();
	var getClubConfiguration = clubConfiguration.getClubConfiguration();
	var teams = [];

	// Call the getClub service (Reads from HostName or Defaults to one in Master Config File)
	getClub.then(function(clubName){
		$scope.clubName = clubName;
				
		// Call the getConfiguration service (Reads in the Master Config XML file and converts to JSON)
		getConfiguration.then(function(configuration){
			$scope.configuration = configuration;
			$scope.tournamentStage = configuration.CONSTANTS.TOURNAMENTSTAGE;
			$scope.tournamentYear = configuration.CONSTANTS.TOURNAMENTYEAR;
			$scope.tournamentDate = configuration.CONSTANTS.TOURNAMENTDATE;
			$scope.tournamentEntryClosingDate = configuration.CONSTANTS.TOURNAMENTENTRYCLOSINGDATE;
			$scope.tournamentEntryOpeningDate = configuration.CONSTANTS.TOURNAMENTENTRYOPENINGDATE;

			var getClubSeasonConfiguration = clubConfiguration.getClubSeasonConfiguration(clubName);
			getClubSeasonConfiguration.then(function(clubSeasonConfiguration){
				$scope.clubSeasonConfiguration = clubSeasonConfiguration;

				// Build the teams for Squash
				for(var teamIndex = 0; teamIndex < $scope.clubSeasonConfiguration.SQUASH.TEAMS.TEAM.length; teamIndex++){

					var team = $scope.clubSeasonConfiguration.SQUASH.TEAMS.TEAM[teamIndex];
					var teamUrl = buildTeamUrl($scope.configuration.CONSTANTS.LEAGUEHOMEPAGE, $scope.configuration.CONSTANTS.TEAMURL, team.DIVISIONID, team.TEAMID, team.COMPETITIONID);

					teams.push({
							teamName: team.NAME,
							divisionName: team.DIVISIONNAME,
							teamUrl: teamUrl
						});
				}

				// Build the teams for Racketball
				for(var teamIndex = 0; teamIndex < $scope.clubSeasonConfiguration.RACKETBALL.TEAMS.TEAM.length; teamIndex++){

					var team = $scope.clubSeasonConfiguration.RACKETBALL.TEAMS.TEAM[teamIndex];
					var teamUrl = buildTeamUrl($scope.configuration.CONSTANTS.LEAGUEHOMEPAGE, $scope.configuration.CONSTANTS.TEAMURL, team.DIVISIONID, team.TEAMID, team.COMPETITIONID);

					teams.push({
							teamName: team.NAME,
							divisionName: team.DIVISIONNAME,
							teamUrl: teamUrl
						});
				}

				$scope.teams = teams;
			});

			// Call the getClubConfiguration service (Reads in the all Clubs XML File and converts to JSON)
			getClubConfiguration.then(function(clubConfiguration){
				$scope.clubConfiguration = clubConfiguration;

				// Find the config for the relevant club name
				for(var clubIndex = 0; clubIndex < $scope.clubConfiguration.CLUBS.CLUB.length; clubIndex++)
				{
					if($scope.clubConfiguration.CLUBS.CLUB[clubIndex].NAME === $scope.clubName)
					{
						$scope.club = $scope.clubConfiguration.CLUBS.CLUB[clubIndex];
						break;
					}
				}
		
				// Build the path to the club logo
				$scope.logoPath = './public/images/logo_' + $scope.club.NAME.toLowerCase() + '_small.png';
			});
		});
	});
}]);