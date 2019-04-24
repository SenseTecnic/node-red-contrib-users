var path = require('path');
var jwt = require('jsonwebtoken');
var cookie = require('cookie');
var crypto = require('crypto');

var APP_DIR = path.join(__dirname, './app');
var JWT_COOKIE_EXPIRY =  604800000; // 7 days

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
  var user = getUserAccount(username);
  // Check if the credentials provided match, if they don't return null
  return user.password == hash(username, password) ? user : null
}

// Check if there is an account that matches the provided username
function getUserAccount(username) {
  var user = usersConfig.credentials.nodeUsers.filter(function (u) {
    return u.username == username
  })[0];
  return user;
}

function getUserExistance(username){
  user = usersConfig.credentials.nodeUsers.filter(function (u) {
    return u.username === username;
  });
  existance = (user != null) ? true : false;
  return existance
}

function addUser(usern, pass){
  newUser = {
	      username: usern,
	      password: hash(usern, pass)
  };
  userConfig.credentials.nodeUsers.push(newUser);
}
/*
function updateUser(original_username, new_username, new_password){
  var user = getUserAccount(original_username);
  if (user != null){
    user.username = new_username;
    user.password = new_password;
    deleteUser(original_username);
    userConfig.credentials.nodeUsers.push(user);
    return getUser(new_username);
  }
  return user;
}


function deleteUser(username){
  // We shouldn't ever let there be more than one occurance of a user, but we don't do
  // anything to ensure it.  Lets loop through to ensure that there are non leftover
  while(getUserExistance(username){
    usersConfig.credentials.nodeUsers.splice(usersConfig.credentials.indexOf(function (u) {
      return u.username == username
    }),1);
  }
}
*/
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
  hash: hash,
  getUserExistance: getUserExistance,
  getUserAccount: getUserAccount,
  getUser: getUser,
  addUser: addUser,
  //updateUser, updateUser,
  //deleteUser: deleteUser,
  verify: verifyJwt
};
