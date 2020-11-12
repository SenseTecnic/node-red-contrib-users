var path = require('path');
var jwt = require('jsonwebtoken');
var cookie = require('cookie');
var crypto = require('crypto');
var bodyParser = require('body-parser');

var APP_DIR = path.join(__dirname, './app');

var log,
  redSettings,
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

function createJwtToken(req, res, payload) {
  var token = jwt.sign(payload, usersConfig.credentials.jwtSecret);
  res.cookie(usersConfig.jwtCookieName, token, {
    maxAge: usersConfig.jwtCookieMaxAge,
    secure: usersConfig.jwtHttpsOnly === true,
    path:   req.baseUrl || '/'
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

  createJwtToken(req, res, {
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
    returnUrl = redSettings.httpNodeRoot+usersConfig.appPath;
    var re = new RegExp('\/{1,}','g');
    returnUrl = returnUrl.replace(re,'/');
    res.status(301).redirect(returnUrl);
  }
}

function appendTrailingSlash(req, res, next) {
  if (req.originalUrl.slice(-1) !== '/') {
    res.redirect(req.originalUrl + '/');
    return;
  }
  next();
}

function init(server, app, _log, redSettings) {
  log = _log;

  if (!usersConfig.appPath) {
    log.error("Node users config not initialized");
    return;
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get(path.join(usersConfig.appPath, 'static/app.css'), function (req, res) {
    res.sendFile(path.join(APP_DIR, 'static', 'app.css'));
  });

  app.get(path.join(usersConfig.appPath, 'static/jquery.min.js'), function (req, res) {
    res.sendFile(path.join(APP_DIR, 'static', 'jquery.min.js'));
  });

  app.post(usersConfig.appPath, handleLogin);

  app.get(path.join(usersConfig.appPath, 'logout'), handleLogout);

  app.get(usersConfig.appPath, appendTrailingSlash, function (req, res) {
    var payload = verifyJwt(req);
    if (payload) {
      res.sendFile(path.join(APP_DIR, 'index.html'));
    } else {
      res.sendFile(path.join(APP_DIR, 'login.html'));
    }
  });

  var fullPath = path.join(redSettings.httpNodeRoot, usersConfig.appPath);
  log.info("Node users started " + fullPath);
}

module.exports = {
  init: function (RED, _usersConfig) {
    usersConfig = _usersConfig;
    redSettings = RED.settings;

    usersConfig.on("close",function() {
      // clean up routes created by this node on close
      var node = this;
      var routes = RED.httpNode._router.stack;

      for(var i=0; i<routes.length; i++) {
        var r = routes[i].route;
        var rgx = new RegExp("^"+node.appPath);
        if (r && rgx.test(r.path)) {
          routes.splice(i,1);
          i--;
        }
      }
    });

    init(RED.server, RED.httpNode, RED.log, RED.settings);
  },
  verify: verifyJwt
};
