
module.exports = function(RED) {

  var users = require('../users')(RED);

  RED.nodes.registerType("login", function (n) {
    RED.nodes.createNode(this, n);
    // users.addBaseConfig();/
  });
}