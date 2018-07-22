homeApp.service('clubConfiguration', function($q, $http, xmlToJson) {

	this.getClubConfiguration = function getClubConfiguration(){
		
		var deferred = $q.defer();

		// Read the master configuration file
		$http.get(CLUBS_CONFIGURATION_FILE_PATH)
			.success(function(xmlData) {
				deferred.resolve(xmlToJson.convert(xmlData));
			})
			.error(function(data) {
				console.log('Error reading master configuration file: ' + CLUBS_CONFIGURATION_FILE_PATH);
				deferred.resolve('');
			});

		return deferred.promise;
	};

	this.getClubSeasonConfiguration = function getClubSeasonConfiguration(clubName){
		
		var deferred = $q.defer();
		var seasonAndYear = getYearAndSeason().toLowerCase();
		var filePath = DIRECTORY_CONFIGURATION + clubName + '/' + seasonAndYear + '.xml';
		
		// Read the master configuration file
		$http.get(filePath)
			.success(function(xmlData) {
				deferred.resolve(xmlToJson.convert(xmlData));
			})
			.error(function(data) {
				console.log('Error reading club season configuration file: ' + filePath);
				deferred.resolve('');
			});

		return deferred.promise;
	};

	this.getProvisionalClubSeasonConfiguration = function getProvisionalClubSeasonConfiguration(clubName){
		
		var deferred = $q.defer();
		var seasonAndYear = getYearAndSeasonForProvisionalRankings().toLowerCase();
		var filePath = DIRECTORY_CONFIGURATION + clubName + '/' + seasonAndYear + '.xml';
		
		// Read the master configuration file
		$http.get(filePath)
			.success(function(xmlData) {
				deferred.resolve(xmlToJson.convert(xmlData));
			})
			.error(function(data) {
				console.log('Error reading club season configuration file: ' + filePath);
				deferred.resolve('');
			});

		return deferred.promise;
	};
});