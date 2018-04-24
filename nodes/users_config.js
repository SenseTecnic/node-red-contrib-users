var users = require('../users');

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

    node.credentials = credentials;
    node.jwtCookieName = n.jwtCookieName;
    users.init(RED, node);
  }

  RED.nodes.registerType("users_config", UsersConfig, {
    credentials: {
      jwtSecret: {type: "text"},
      nodeUsers: {type: "text"}
    }
  });
};