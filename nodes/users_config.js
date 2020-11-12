var users = require('../users');

var DEFAULT_JWT_COOKIE_MAX_AGE = 604800000; // 7 days
var DEFAULT_APP_PATH = '/users';

module.exports = function (RED) {

  function UsersConfig(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    var credentials = RED.nodes.getCredentials(n.id);

    if (credentials === undefined) {
      node.error(RED._("users.errors.missing-users-config"));
      return;
    }

    if (!credentials.nodeUsers) {
      node.error(RED._("users.errors.missing-users-list"));
      return;
    }

    if (!credentials.jwtSecret) {
      node.error(RED._("users.errors.missing-jwt-secret"));
      return;
    }

    if (!n.jwtCookieName) {
      node.error(RED._("users.errors.missing-jwt-cookie-name"));
      return;
    }

    // if (!n.jwtCookieMaxAge) {
    //   node.error(RED._("users.errors.missing-jwt-cookie-max-age"));
    //   return;
    // }

    node.credentials = credentials;
    node.jwtCookieName = n.jwtCookieName;
    node.jwtCookieMaxAge = n.jwtCookieMaxAge || DEFAULT_JWT_COOKIE_MAX_AGE;
    node.jwtHttpsOnly = n.jwtHttpsOnly === true;
    node.appPath = n.appPath || DEFAULT_APP_PATH;
    users.init(RED, node);
  }

  RED.nodes.registerType("users_config", UsersConfig, {
    credentials: {
      jwtSecret: {type: "text"},
      nodeUsers: {type: "text"}
    }
  });
};