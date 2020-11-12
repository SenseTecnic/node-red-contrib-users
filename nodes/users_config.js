var users = require('../users');

function parseDuration(string)
{
  const SECONDS = 1000;
  const MINUTES = 60 * SECONDS;
  const HOURS = 60 * MINUTES;
  const DAYS = 24 * HOURS;
  const WEEKS = 7 * DAYS;
  const MONTHS = 30 * DAYS;
  const YEARS = 365 * DAYS;

  function intGroup1(match)
  {
    return match && parseInt(match[1]);
  }

  function captureField(string, unit)
  {
    return string && intGroup1(string.match(new RegExp(`\\b(\\d+)${unit}\\b`))) || 0;
  }

  return (
    captureField(string, 'ms') +
    captureField(string, 's') * SECONDS +
    captureField(string, 'm') * MINUTES +
    captureField(string, 'h') * HOURS +
    captureField(string, 'd') * DAYS +
    captureField(string, 'w') * WEEKS +
    captureField(string, 'M') * MONTHS +
    captureField(string, 'y') * YEARS
  );
}

var DEFAULT_JWT_COOKIE_MAX_AGE = parseDuration('1w');
var DEFAULT_APP_PATH = '/users';

module.exports = function (RED) {

  function UsersConfig(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    var credentials = RED.nodes.getCredentials(n.id);

    if (credentials === undefined) {
      node.error(RED._("users.errors.missing-users-config"));
      return;
    }

    if (!credentials.nodeUsers) {
      node.error(RED._("users.errors.missing-users-list"));
      return;
    }

    if (!credentials.jwtSecret) {
      node.error(RED._("users.errors.missing-jwt-secret"));
      return;
    }

    if (!n.jwtCookieName) {
      node.error(RED._("users.errors.missing-jwt-cookie-name"));
      return;
    }

    node.credentials = credentials;
    node.jwtCookieName = n.jwtCookieName;
    node.jwtCookieMaxAge = parseDuration(n.jwtCookieMaxAge) || DEFAULT_JWT_COOKIE_MAX_AGE;
    node.jwtHttpsOnly = n.jwtHttpsOnly === true;
    node.appPath = n.appPath || DEFAULT_APP_PATH;
    users.init(RED, node);
  }

  RED.nodes.registerType("users_config", UsersConfig, {
    credentials: {
      jwtSecret: {type: "text"},
      nodeUsers: {type: "text"}
    }
  });
};