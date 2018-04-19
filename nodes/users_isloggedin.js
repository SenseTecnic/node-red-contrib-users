var users = require('../users');

module.exports = function (RED) {

  function UsersIsLoggedInNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.status({});

    var config;

    RED.nodes.eachNode(function (n) {
      if (n.type === "users_config") {
        config = RED.nodes.getCredentials(n.id);
      }
    });

    // var nodeUsers = RED.nodes.getCredentials(config.id).nodeUsers;

    if (!config) {
      node.error(RED._("users.errors.missing-users-config"));
      node.status({fill: "red", shape: "ring", text: RED._("users.errors.missing-users-config")});
      return;
    }
    if (!config.nodeUsers) {
      node.error(RED._("users.errors.missing-users-list"));
      node.status({fill: "red", shape: "ring", text: RED._("users.errors.missing-users-list")});
      return;
    }
    if (!config.jwtSecret) {
      node.error(RED._("users.errors.missing-jwt-secret"));
      node.status({fill: "red", shape: "ring", text: RED._("users.errors.missing-jwt-secret")});
      return;
    }

    node.on('input', function (msg) {
      if (!msg.req || !msg.res) {
        node.error(RED._("users.errors.http-node-required"), msg);
        node.status({fill: "red", shape: "ring", text: RED._("users.errors.http-node-required-status")});
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