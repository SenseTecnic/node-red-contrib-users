var path = require('path');
var jwt = require('jsonwebtoken');
var cookie = require('cookie');
var crypto = require('crypto');
var serveStatic = require('serve-static');

var APP_DIR = path.join(__dirname, './app');
var APP_PATH = '/users';
var JWT_COOKIE_EXPIRY =  604800000; // 7 days

var inited = false;
var log,
  usersConfig;

function getTokenFromRequest(req) {
  var header = req.headers.cookie;
  // read from cookie header
  if (header) {
    var cookies = cookie.parse(header);
    return cookies[usersConfig.jwtCookieName];
  }
}

function verifyJwt(req) {
  var jwtCookie = getTokenFromRequest(req);
  if (!jwtCookie) {
    log.trace("Node users: jwt cookie not found");
    return false;
  }
  try {
    return jwt.verify(jwtCookie, usersConfig.credentials.jwtSecret);
  } catch (err) {
    log.trace("Node users: Failed to verify jwt - " + err);
    return false;
  }
}

function createJwtToken(req, res, jwtSecret, jwtCookieName, payload) {
  var token = jwt.sign(payload, jwtSecret);
  res.cookie(jwtCookieName, token, {
    maxAge: JWT_COOKIE_EXPIRY,
    secure: usersConfig.jwtHttpsOnly === true
  });
}

function clearJwt(res) {
  res.clearCookie(usersConfig.jwtCookieName);
}

function hash(username, password) {
  // username is used as part of the salt for the hash
  var hash = crypto.createHash('sha512').update(password+"."+username, 'utf8').digest('hex');
  return hash;
}

function getUser(username, password) {
  var user = usersConfig.credentials.nodeUsers.filter(function (u) {
    return u.username === username && u.password === hash(username, password);
  })[0];
  return user;
}

function handleLogin(req, res) {
  if (!usersConfig  || !usersConfig.credentials || !usersConfig.credentials.jwtSecret) {
    log.error("Node users: missing or incomplete users config");
    return res.status(503).send("Node users not initialized");
  }

  var username = req.body.username;
  var password = req.body.password;
  var user = getUser(username, password);

  if (!user) {
    res.status(401).send('Unauthorized');
    return;
  }

  log.debug('Authenticated node user:'+user.username);

  createJwtToken(req, res, usersConfig.credentials.jwtSecret, usersConfig.jwtCookieName, {
    username: user.username,
    scope: user.scope
  });

  res.status(204).send();
}

function handleLogout(req, res) {
  var returnUrl = req.query.return;
  clearJwt(res);
  if (returnUrl) {
    res.status(301).redirect(returnUrl);
  } else {
    res.status(301).redirect(APP_PATH);
  }
}

function init(server, app, _log, redSettings) {
  var fullPath = path.join(redSettings.httpAdminRoot, APP_PATH);
  log = _log;

  app.post(path.join(APP_PATH, '/'), handleLogin);

  app.get(path.join(APP_PATH, '/logout'), handleLogout);

  app.use(path.join(APP_PATH, 'static'), serveStatic(path.join(APP_DIR, 'static')));

  app.get(path.join(APP_PATH, '/'), function (req, res) {
    var payload = verifyJwt(req);
    if (payload) {
      res.sendFile(path.join(APP_DIR, 'index.html'));
    } else {
      res.sendFile(path.join(APP_DIR, 'login.html'));
    }
  });

  log.info("Node users started " + fullPath);
}

module.exports = {
  init: function (RED, _usersConfig) {
    if (!inited) {
      inited = true;
      init(RED.server, RED.httpAdmin, RED.log, RED.settings);
    }
    usersConfig = _usersConfig;
  },
  verify: verifyJwt,
  getPath: function () {
    return APP_PATH;
  }
};