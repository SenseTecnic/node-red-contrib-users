var jwt = require('jsonwebtoken');
var cookie = require('cookie');

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
    return false;
  }
  try {
    return jwt.verify(jwtCookie, jwtSecret); 
  } catch (err) {
    return false;
  }
}

module.exports = function (RED) {

  function UsersIsLoggedInNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.status({});
    node.usersConfig = RED.nodes.getNode(n.usersConfig);

    node.on('input', function (msg) {
      var authenticatedUser = verifyJwt(msg.req, node.usersConfig.jwtSecret);
      if (authenticatedUser) {
        msg.payload.nodeUser = authenticatedUser;
        node.status({fill: "green", shape: "dot", text: "Authenticated: "+authenticatedUser.username});
        node.send([msg, null]);
      } else {
        node.status({fill: "red", shape: "dot", text: "Unauthorized"});
        node.send([null, msg]);
      }
    });

  }

  RED.nodes.registerType("users_isloggedin", UsersIsLoggedInNode);
};