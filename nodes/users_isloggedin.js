var path = require('path');
var users = require('../users');

module.exports = function (RED) {

  function UsersIsLoggedInNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.status({});
    node.enableCustomHandler = n.enableCustomHandler;

    var config;

    RED.nodes.eachNode(function (n) {
      if (n.type === "users_config") {
        config = n;
        config.credentials = RED.nodes.getCredentials(n.id);
      }
    });

    if (!config || !config.credentials) {
      node.error(RED._("users.errors.missing-users-config"));
      node.status({fill: "red", shape: "ring", text: RED._("users.errors.missing-users-config")});
      return;
    }
    if (!config.credentials.nodeUsers) {
      node.error(RED._("users.errors.missing-users-list"));
      node.status({fill: "red", shape: "ring", text: RED._("users.errors.missing-users-list")});
      return;
    }
    if (!config.credentials.jwtSecret) {
      node.error(RED._("users.errors.missing-jwt-secret"));
      node.status({fill: "red", shape: "ring", text: RED._("users.errors.missing-jwt-secret")});
      return;
    }
    if (!config.jwtCookieName) {
      node.error(RED._("users.errors.missing-jwt-cookie-name"));
      node.status({fill: "red", shape: "ring", text: RED._("users.errors.missing-jwt-cookie-name")});
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

        if (node.enableCustomHandler) {
          node.send([null, msg]);
        } else {
          var currentUrl = msg.req.protocol + '://' + msg.req.get('host') + msg.req.originalUrl;
          var redirectUrl = path.join(RED.settings.httpNodeRoot, users.getPath())+"?return="+currentUrl;
          msg.res.redirect(redirectUrl); // TODO: fix deprecation warning
        }
      }
    });
  }

  RED.nodes.registerType("users_isloggedin", UsersIsLoggedInNode);
};