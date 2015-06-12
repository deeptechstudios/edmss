/**
 * Created by Daniel on 6/11/2015.
 */


module.exports = function IndexModule(pb) {

	//dependencies
	var util          = pb.util;
	var PluginService = pb.PluginService;
	var TopMenu       = pb.TopMenuService;
	var MediaLoader   = pb.MediaLoader;

	function Index() {}
	util.inherits(Index, pb.BaseController);
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

	//exports
	return Index;
};

