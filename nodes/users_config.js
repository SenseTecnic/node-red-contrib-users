var users = require('../users');

module.exports = function (RED) {

  function UsersConfig(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    var credentials = RED.nodes.getCredentials(n.id);

    if (credentials === undefined) {
      node.error(RED._("users.errors.missing-users-config"));
    }

    if (!credentials.nodeUsers) {
      node.error(RED._("users.errors.missing-users-list"));
    }

    if (!credentials.jwtSecret) {
      node.error(RED._("users.errors.missing-jwt-secret"));
    }

    node.credentials = credentials;
    users.init(RED, node);
  }

  RED.nodes.registerType("users_config", UsersConfig, {
    credentials: {
      jwtSecret: {type: "text"},
      nodeUsers: {type: "text"}
    }
  });
};