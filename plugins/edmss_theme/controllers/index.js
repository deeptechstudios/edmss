/**
 * Created by Daniel on 6/11/2015.
 */

var async = require('async');

module.exports = function IndexModule(pb) {

	//dependencies
	var util          = pb.util;
	var TopMenu       = pb.TopMenuService;

	function Index() {}
	util.inherits(Index, pb.BaseController);

    Index.getRoutes = function(cb) {
		var routes = [
			{
				method: 'get',
				path: '/',
				auth_required: false,
				content_type: 'text/html'
			}
		];
		cb(null, routes);
	};

	/**
	 * This is the function that will be called by the system's RequestHandler.  It
	 * will map the incoming route to the ones below and then instantiate this
	 * prototype.  The request handler will then proceed to call this function.
	 * Its callback should contain everything needed in order to provide a response.
	 *
	 * @param cb The callback.  It does not require a an error parameter.  All
	 * errors should be handled by the controller and format the appropriate
	 *  response.  The system will attempt to catch any catastrophic errors but
	 *  makes no guarantees.
	 */
	Index.prototype.render = function(cb) {
		var self = this;

		var content = {
			content_type: "text/html",
			code: 200
		};

		var options = {
			currUrl: this.req.url
		};
		TopMenu.getTopMenu(self.session, self.ls, options, function(themeSettings, navigation, accountButtons) {
			TopMenu.getBootstrapNav(navigation, accountButtons, function (navigation, accountButtons) {

				pb.plugins.getSettings('edmss_theme', function (err, pluginSettings) {
					for (var i = 0; i < pluginSettings.length; i++) {
						switch (pluginSettings[i].name) {
							// TODO plugin settings
							default:
								break;
						}
					}

					self.ts.registerLocal('navigation', new pb.TemplateValue(navigation, false));
                    self.ts.registerLocal('account_buttons', new pb.TemplateValue(accountButtons, false));
                    self.ts.registerLocal('radio_sets', function(flag, cb) {
                        var objService = new pb.CustomObjectService();
                        objService.loadTypeByName('Mix', function(err, customType) {
                            objService.findByType(customType, function(err, mixes) {
                                var tasks = util.getTasks(mixes, function(mixes, i) {
                                    return function(callback) {
                                        if (i >= 5) {//TODO, limit mixes in query, not through hackery
                                            callback(null, '');
                                            return;
                                        }
                                        self.renderMix(mixes[i], i, callback);
                                    };
                                });
                                async.parallel(tasks, function(err, result) {
                                    cb(err, new pb.TemplateValue(result.join(''), false));
                                });
                            });
                        });
                    });

                    self.ts.registerLocal('angular', function(flag, cb) {
                        var objects = {
                            trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
                        };
                        var angularData = pb.ClientJs.getAngularController(objects, ['ngSanitize']);
                        cb(null, angularData);
                    });

                    self.getPlaylist(function(playlist) {
                        var angularObjects = pb.ClientJs.getAngularObjects({
                            streaming: self.isStreaming(),
                            loading: false,
                            playing: false,
                            playlist: playlist,
                            currTrack: 0,
                            lastTrack: -1
                        });
                        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                    });

                    self.ts.load('index', function (err, template) {
						if (util.isError(err)) {
							content.content = '';
						}
						else {
							content.content = template;
						}

						cb(content);
					});
				});
			});
		});
	};

    Index.prototype.renderMix = function(mix, index, callback) {
        var self = this;

        var ats = this.ts.getChildInstance();
        self.ts.reprocess = false;
        ats.registerLocal('mix_id', mix[pb.DAO.getIdField()].toString());
        ats.registerLocal('mix_index', index);
        ats.registerLocal('mix_name', mix['name']);
        ats.registerLocal('mix_artist', mix['Artist']);
        ats.registerLocal('mix_date', function(flag, cb) {
            var date = mix['Date'];
            var month = ['January','Feburary','March','April','May','June',
                'July','August','September','October','November','December'][date.getMonth()];
            var day = date.getDay();
            var year = date.getFullYear();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            cb(null, month + " " + day + ", " + year + " " + hours + ":" +
                (minutes > 9 ? minutes : "0" + minutes) +
                (hours < 12 ? "AM" : "PM")
            );
        });
        ats.registerLocal('mix_description', "This mix has no description.");
        ats.registerLocal('mix_media', function(flag, cb) {
            var mediaService = new pb.MediaService();
            mediaService.renderById(mix['Media'], function(err, content) {
                cb(null, content);
            });
        });
        /*ats.registerLocal('mix_genres', function(flag, cb) {

        });*/

        ats.load('elements/mix', callback);
    };

    Index.prototype.getPlaylist = function(cb) {
        var self = this;

        var playlist = [];
        var objService = new pb.CustomObjectService();
        objService.loadTypeByName('Mix', function(err, customType) {
            objService.findByType(customType, function(err, mixes) {
                for (var i in mixes) {
                    playlist.push({
                        name: mixes[i]['name'],
                        artist: mixes[i]['Artist'],
                        src: '',
                        type: '',
                        art: 'http://images-mix.netdna-ssl.com/w/120/h/120/q/85/upload/images/profile/475821f6-feb3-43ce-aa08-f50f568167c4.jpg'
                    })
                }
                if (self.isStreaming()) {
                    playlist.unshift({
                        name: 'WREK Player',
                        artist: 'DJ Spurdo',
                        src: 'http://streaming.wrek.org:8000/wrek_live-128kb',
                        type: 'audio/mpeg',
                        art: 'https://upload.wikimedia.org/wikipedia/en/b/b8/WREK_Logo.png'
                    })
                }
                cb(playlist);
            });
        });
    };

    Index.prototype.isStreaming = function() {
        return true;
        var now = new Date();
        return (now.getDay() == 6 && (now.getHours() >= 21)) || (now.getDay() == 0 && (now.getHours() == 0 && now.getMinutes() <= 2));
    };



	//exports
	return Index;
};

