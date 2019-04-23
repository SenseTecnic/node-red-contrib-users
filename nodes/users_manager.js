var path = require('path');
var users = require('../users');


function checkedRequiredFields(RED, node, config, msg) {
  // Message testing conditions
  if (false) {
    throw new Error("users.errors.http-node-required");
  }
}

module.exports = function (RED) {

  function UsersManagerNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.status({});

    // Searching though all nodes to find the users_config node
    // to extract the credentials from
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
        msg.res.send("Error: invalid config");
      }

      if (true) {
        node.status({fill: "green", shape: "dot", text: "Valid"});
        //node.send([msg, null]);
      } else {
        node.status({fill: "yellow", shape: "dot", text: "Invalid"});
      }

      // Testing function
      credentials = config.credentials;
      msg.payload = credentials;
      node.send(msg);
    });
  }

  RED.nodes.registerType("users_manager", UsersManagerNode);
};
