var path = require('path');
var jwt = require('jsonwebtoken');
var cookie = require('cookie');
// var bcrypt = require('bcrypt');
var serveStatic = require('serve-static');

var APP_DIR = path.join(__dirname, './app');
var APP_PATH = '/users';
var JWT_COOKIE_NAME = 'nr.nodeUsers.jwt';
var JWT_COOKIE_EXPIRY =  604800000; // 7 days
// var PW_SALT_ROUNDS = 10;

var inited = false;
var log,
  usersConfig,
  jwtSecret;

function getRandomStr(len) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = len; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)]
  };
  return result;
}

function createJwtToken(req, res, jwtSecret, jwtCookieName, payload) {
  var token = jwt.sign(payload, jwtSecret); // TODO: add expiry and algorithm
  res.cookie(jwtCookieName, token, {
    maxAge: JWT_COOKIE_EXPIRY
  });
}

function getTokenFromRequest(req) {
  var header = req.headers.cookie;
  // read from cookie header
  if (header) {
    var cookies = cookie.parse(header);
    return cookies[JWT_COOKIE_NAME];
  }
}

function verifyJwt(req) {
  var jwtCookie = getTokenFromRequest(req);
  if (!jwtCookie) {
    log.trace("Node users: jwt cookie not found");
    return false;
  }
  try {
    return jwt.verify(jwtCookie, jwtSecret); 
  } catch (err) {
    log.trace("Node users: " + err);
    return false;
  }
}

function clearJwt(res) {
  res.clearCookie(JWT_COOKIE_NAME);
}

function handleLogin(req, res) {
  if (!usersConfig) {
    return res.status("500").send("Node users not initialized");
  }
  // TODO: move to separate controller
  var returnUrl = req.query.return;
  var username = req.body.username;
  var password = req.body.password;

  var user = usersConfig.nodeUsers.filter(function (u) {
    return u.username === username && u.password === password;
  })[0];

  if (user === undefined) {
    res.status(401).send('Unauthorized');
    return;
  }

  log.debug('Authenticated node user:'+user.username);

  createJwtToken(req, res, jwtSecret, JWT_COOKIE_NAME, {
    username: user.username,
    role: user.role
  });

  res.status(204).send();
}

function handleLogout(req, res) {
  var returnUrl = req.query.return;
  clearJwt(res);
  if (returnUrl) {
    res.redirect(returnUrl);
  } else {
    res.sendFile(path.join(APP_DIR, 'login.html'));
  }
}

function init(server, app, _log, redSettings) {
  var fullPath = path.join(redSettings.httpAdminRoot, APP_PATH);
  log = _log;
  jwtSecret = getRandomStr(32); // generate new jwt secret

  app.post(path.join(APP_PATH, '/login'), function (req, res) {
    handleLogin(req, res);
  });

  app.get(path.join(APP_PATH, '/logout'), function (req, res) {
    handleLogout(req, res);
  });

  app.use(path.join(APP_PATH, 'static'), serveStatic(path.join(APP_DIR, 'static')));
  // app.use(APP_PATH, serveStatic(path.join(APP_DIR)));

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

module.exports = function (RED) {
  if (!inited) {
    inited = true;
    init(RED.server, RED.httpAdmin, RED.log, RED.settings);
  }

  function UsersConfig(n) {
    RED.nodes.createNode(this,n);
    var node = this;

    if (n.nodeUsers === undefined) {
      log.error("Node users: Missing user list");
      node.error(RED._("users.errors.missing-user-list"));
    }

    usersConfig = n;
    // n.nodeUsers.forEach(function (u) {
    //   if (u.dirty) {
    //     try {
    //       var hash = bcrypt.hashSync(u.password.toString(), PW_SALT_ROUNDS);
    //       u.password = hash;
    //     } catch (err) {
    //       console.error(err);
    //       node.error(RED._("users.errors.password-hash-failed"));
    //     }
    //   }
    //   delete u.dirty;
    // });
  }

  function UsersLoginNode(n) { // TODO: make this a singleton node
    RED.nodes.createNode(this,n);
    var node = this;
    node.status({});
    node.usersConfig = RED.nodes.getNode(n.usersConfig);
  }

  RED.nodes.registerType("users-config", UsersConfig);

  RED.nodes.registerType("users-login", UsersLoginNode);

};