

module.exports = function (RED) {

  function UsersLoginNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.status({});
    node.usersConfig = RED.nodes.getNode(n.usersConfig);
  }

  RED.nodes.registerType("users_login", UsersLoginNode);
};