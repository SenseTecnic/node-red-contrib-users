var APP_DIR = path.join(__dirname, './app');

function init(server, app, log, redSettings) {
  var dashSettings = redSettings.dashboard || {};
  settings.path = dashSettings.path || '/dashboard';

  var fullPath = path.join(redSettings.httpAdminRoot, settings.path);

  app.use('/login/*', serveStatic(APP_DIR));

  log.info("node-red-contrib-users system started at " + fullPath);

  io.on('connection', onConnect);
}

module.exports = function (RED) {

  if (!inited) {
    inited = true;
    init(RED.server, RED.httpAdmin, RED.log, RED.settings);
  }

};