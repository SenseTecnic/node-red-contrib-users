var users = require('../users');

module.exports = function (RED) {

  function UsersIsLoggedInNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.status({});

    var config = null;

    RED.nodes.eachNode(function (n) {
      if (n.type === "users_config") {
        config = n;
      }
    });

    if (config === null) {
      node.error(RED._("users.errors.missing-users-config"));
      node.status({fill: "red", shape: "ring", text: RED._("users.errors.missing-users-config")});
    }
    if (config.nodeUsers.length === 0) {
      node.error(RED._("users.errors.empty-users-list"));
      node.status({fill: "red", shape: "ring", text: RED._("users.errors.empty-users-list")});
    }
    if (!config.jwtSecret) {
      node.error(RED._("users.errors.missing-jwt-secret"));
      node.status({fill: "red", shape: "ring", text: RED._("users.errors.missing-jwt-secret")});
    }

    node.usersConfig = config;

    node.on('input', function (msg) {
      if (!msg.req || !msg.res) {
        node.error(RED._("users.errors.http-node-required"), msg);
        node.status({fill: "red", shape: "ring", text: RED._("users.errors.http-node-required-status")});
        return;
      }
      if (!node.usersConfig) {
        node.error(RED._("users.errors.missing-users-config"), msg);
        node.status({fill: "red", shape: "ring", text: RED._("users.errors.missing-users-config")});
        return;
      }

      var authenticatedUser = users.verify(msg.req);

      if (authenticatedUser) {
        msg.payload.nodeUser = authenticatedUser;
        node.status({fill: "green", shape: "dot", text: "Authenticated: "+authenticatedUser.username});
        node.send([msg, null]);
      } else {
        node.status({fill: "yellow", shape: "dot", text: "Unauthorized"});
        node.send([null, msg]);
      }
    });
  }

  RED.nodes.registerType("users_isloggedin", UsersIsLoggedInNode);
};