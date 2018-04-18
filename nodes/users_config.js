var users = require('../users');

module.exports = function (RED) {

  function UsersConfig(n) {
    RED.nodes.createNode(this,n);
    var node = this;

    if (n.nodeUsers === undefined) {
      node.error(RED._("users.errors.missing-users-config"));
    }

    if (!n.jwtSecret) {
      node.error(RED._("users.errors.missing-jwt-secret"));
    }

    users.init(RED, n);
    node.nodeUsers = n.nodeUsers;
    node.jwtSecret = n.jwtSecret;
  }

  RED.nodes.registerType("users_config", UsersConfig);
};