homeApp.controller('TournamentController', ['$scope', '$http', 'club', function($scope, $http, club) {
    
	var getClub = club.getClub();
	getClub.then(function(clubName){
		
		// Get History
		$http.get('./data_generated/tournament/'+ clubName + '/tournament_history.json')
			.success(function(data) {
				$scope.tournamentHistory = data.xml.tournament;
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});	
	});	
}]);