var path = require('path');
var users = require('../users');


function checkedRequiredFields(RED, node, config, msg) {
  if (!msg.req || !msg.res) {
    throw new Error("users.errors.http-node-required");
  }
  if (!config || !config.credentials) {
    throw new Error("users.errors.missing-users-config");
  }
  if (!config.credentials.nodeUsers) {
    throw new Error("users.errors.missing-users-list");
  }
  if (!config.credentials.jwtSecret) {
    throw new Error("users.errors.missing-jwt-secret");
  }
  if (!config.jwtCookieName) {
    throw new Error("users.errors.missing-jwt-cookie-name");
  }
}

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

    node.on('input', function (msg) {
      try {
        checkedRequiredFields(RED, node, config, msg);
      } catch (err) {
        node.error(RED._(err.message));
        node.status({fill: "red", shape: "ring", text: RED._(err.message)});
        msg.res.status(500);
        if (node.enableCustomHandler) {
          node.send([null, msg]);
        } else {
          msg.res.send("Error: invalid config");
        }
      }

      var authenticatedUser = users.verify(msg.req);

      if (authenticatedUser) {
        msg.payload.user = authenticatedUser;
        msg.req.user = authenticatedUser;
        node.status({fill: "green", shape: "dot", text: "Authenticated: "+authenticatedUser.username});
        node.send([msg, null]);
      } else {
        node.status({fill: "yellow", shape: "dot", text: "Unauthorized"});

        if (node.enableCustomHandler) {
          node.send([null, msg]);
        } else {
          var currentUrl = msg.req.protocol+'://'+msg.req.get('host')+msg.req.originalUrl;
          var redirectUrl = path.join(RED.settings.httpNodeRoot, config.appPath)+"?return="+currentUrl;
          msg.res.redirect(redirectUrl); // TODO: fix deprecation warning
        }
      }
    });
  }

  RED.nodes.registerType("users_isloggedin", UsersIsLoggedInNode);
};