Cryptocat.Storage = {};

(function() {
	'use strict';
	var db = {};
	
	(function() {
		var path = '';
		if (process.platform === 'win32') {
			path = process.env.APPDATA + '\\Cryptocat\\';
			db = new NeDB({
				filename: path + 'users.db',
				autoload: true
			});
		}
		else {
			var path = process.env.HOME + '/.config';
			FS.stat(path, function(err, stats) {
				if (err || !stats.isDirectory()) {
					FS.mkdirSync(path, 0o700);
				}
				else {
					FS.chmodSync(path, 0o700);
				}
				path += '/Cryptocat';
				FS.stat(path, function(err, stats) {
					if (err || !stats.isDirectory()) {
						FS.mkdirSync(path, 0o700);
					}
					else {
						FS.chmodSync(path, 0o700);
					}
					path += '/';
					db = new NeDB({
						filename: path + 'users.db',
						autoload: true
					});
				});
			});
		}
	})();

	Cryptocat.Storage.updateCommon = function(common, callback) {
		var newCommon = {
			_id: '*common*',
			mainWindowBounds: {}
		};
		db.findOne({_id: '*common*'}, function(err, doc) {
			if (doc === null) {
				if (hasProperty(common, 'mainWindowBounds')) {
					newCommon.mainWindowBounds = common.mainWindowBounds;
				}
				db.insert(newCommon, function(err, newDoc) {
					db.persistence.compactDatafile();
					callback(err);
				});
			}
			else {
				var updateObj = {};
				if (hasProperty(common, 'mainWindowBounds')) {
					updateObj.mainWindowBounds = common.mainWindowBounds;
				}
				db.update({_id: '*common*'},
					{$set: updateObj}, function(err, newDoc) {
						db.persistence.compactDatafile();
						callback(err);
					}
				);
			}
		});
	};

	Cryptocat.Storage.getCommon = function(callback) {
		db.findOne({_id: '*common*'}, function(err, doc) {
			callback(err, doc);
		});
	};

	Cryptocat.Storage.updateUser = function(username, loadedSettings, callback) {
		var settings = Object.assign({}, loadedSettings);
		var newObj = Object.assign({}, Cryptocat.EmptyMe.settings);
		db.findOne({_id: username}, function(err, doc) {
			if (doc === null) {
				newObj._id = username;
				for (var setting in newObj) {
					if (
						hasProperty(newObj, setting) &&
						hasProperty(settings, setting)
					) {
						newObj[setting] = settings[setting];
					}
				}
				db.insert(newObj, function(err, newDoc) {
					db.persistence.compactDatafile();
					callback(err);
				});
			}
			else {
				var updateObj = {};
				for (var setting in newObj) {
					if (
						hasProperty(newObj, setting) &&
						hasProperty(settings, setting) &&
						(setting !== 'identityKey') &&
						(setting !== 'identityDHKey') &&
						(setting !== 'deviceId') &&
						(setting !== 'deviceName') &&
						(setting !== 'deviceIcon')
					) {
						updateObj[setting] = settings[setting];
					}
				}
				db.update({_id: username},
					{$set: updateObj}, function(err, newDoc) {
						db.persistence.compactDatafile();
						callback(err);
					}
				);
			}
		});
	};

	Cryptocat.Storage.updateUserBundles = function(
		username, user, userBundles, overwriteAxolotl, callback
	) {
		var bundleObj = {};
		for (var deviceId in userBundles) { if (hasProperty(userBundles, deviceId)) {
			var bundle = 'userBundles.' + user  + '.' + deviceId;
			bundleObj[bundle + '.identityKey'] = userBundles[deviceId].identityKey;
			bundleObj[bundle + '.signedPreKey'] = userBundles[deviceId].signedPreKey;
			bundleObj[bundle + '.signedPreKeyId'] = userBundles[deviceId].signedPreKeyId;
			bundleObj[bundle + '.signedPreKeySignature'] = userBundles[deviceId].signedPreKeySignature;
			bundleObj[bundle + '.preKeys'] = userBundles[deviceId].preKeys;
			if (overwriteAxolotl) {
				bundleObj[bundle + '.axolotl'] = userBundles[deviceId].axolotl;
			}
		}}
		db.update({_id: username},
			{$set: bundleObj}, function(err, newDoc) {
				db.persistence.compactDatafile();
				callback(err);
			}
		);
	};

	Cryptocat.Storage.deleteUser = function(username, callback) {
		db.remove({_id: username}, {}, function(err) {
			db.persistence.compactDatafile();
			callback(err);
		});
	};

	Cryptocat.Storage.getUser = function(username, callback) {
		var newObj = Object.assign({}, Cryptocat.EmptyMe.settings);
		db.findOne({_id: username}, function(err, doc) {
			for (var setting in newObj) {
				if (
					hasProperty(newObj, setting) &&
					hasProperty(doc, setting)
				) {
					newObj[setting] = doc[setting];
				}
			}
			callback(err, newObj);
		});
	};

})();
