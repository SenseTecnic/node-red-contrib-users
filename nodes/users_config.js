// var bcrypt = require('bcrypt');
// var PW_SALT_ROUNDS = 10;


module.exports = function (RED) {

  function UsersConfig(n) {
    RED.nodes.createNode(this,n);
    var node = this;

    if (n.nodeUsers === undefined) {
      log.error("Node users: Missing user list");
      node.error(RED._("users.errors.missing-user-list"));
    }

    var users = require('../users')(RED, n);
    // n.nodeUsers.forEach(function (u) {
    //   if (u.dirty) {
    //     try {
    //       var hash = bcrypt.hashSync(u.password.toString(), PW_SALT_ROUNDS);
    //       u.password = hash;
    //     } catch (err) {
    //       console.error(err);
    //       node.error(RED._("users.errors.password-hash-failed"));
    //     }
    //   }
    //   delete u.dirty;
    // });
  }

  RED.nodes.registerType("users_config", UsersConfig);
};