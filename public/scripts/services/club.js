homeApp.service('club', function($q, configuration) {

	this.getClub = function getClub() {
	
		var deferred = $q.defer();
		
		var hostName = window.location.hostname;

		// Try and determine club from the host name
		if (hostName.indexOf("-") > 0) {
			deferred.resolve(hostName.substr(0, hostName.indexOf("-")).capitalize());
		} else{
			var getConfiguration = configuration.getConfiguration();
			getConfiguration.then(function(configurationData){
				deferred.resolve(configurationData.CONSTANTS.CLUB);
			});
		}
		
		return deferred.promise;
	};
});