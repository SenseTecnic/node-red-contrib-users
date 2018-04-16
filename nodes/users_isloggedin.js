var jwt = require('jsonwebtoken');

var JWT_COOKIE_NAME = 'nr.nodeUsers.jwt';


function getTokenFromRequest(req) {
  var header = req.headers.cookie;
  // read from cookie header
  if (header) {
    var cookies = cookie.parse(header);
    return cookies[JWT_COOKIE_NAME];
  }
}

function verifyJwt(req, jwtSecret) {
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

module.exports = function (RED) {

  function UsersIsLoggedInNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.status({});
    node.usersConfig = RED.nodes.getNode(n.usersConfig);

    console.log(node.usersConfig)


    node.on('input', function (msg) {


      console.log(node.usersConfig)

      node.send(msg);
    });

  }

  RED.nodes.registerType("users_isloggedin", UsersIsLoggedInNode);
};