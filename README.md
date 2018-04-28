# node-red-contrib-users

## Overview

This node allows Node-RED developers to quickly build a very simple user access control for their HTTP-based flows. Using this node, you can limit access to the HTTP endpoints (`http in` nodes) in your flows to a list of users that you configure yourself.  The node adds the current user to the request message so that you can serve different responses depending on the username or a custom "scope" field of the user who is logged in.

## Installation and Usage

1. Go to your Node-RED users directory and run: `npm install node-red-contrib-users`
2. Start Node-RED
3. Create the allowed users list by going to the "users" tab on the right hand side of the Node-RED editor. Add users by filling in the username, password and scope (optional) and clicking the "Add user to whitelist" button. You can remove users by clicking the [x] button next to their username in the list.
4. Deploy the flow. See example flow below for usage.

### Default endpoints

When installed the node adds the following endpoints to Node-RED:

#### GET <settings.httpNodeRoot>/users

Displays the default login page.

#### POST <settings.httpNodeRoot>/users

This will authenticate the user, create the JWT and save it in a cookie. Expects `username` and `password` in the request body. Returns 200 on success and 401 if user is unauthorized.

#### GET <settings.httpNodeRoot>/users/logout

Logs out the user. The JWT cookie will be removed and you will be redirected to the default login page. The logout endpoint accepts the URL parameter `return` which can be used to redirect the user to a custom URL after logout (i.e. "http://localhost:1880/users/logout?return=http://www.someothersite.com").

### isLoggedIn node

The `is logged in` node acts like a middleware that check and verifies the json web token (JWT) in the incoming request. It expects req and res objects in the msg input, usually from a `http in` node.

If the JWT successfully passes verification, the node will add the JWT payload (username and scope) to the msg.payload.user and msg.req.user objects and pass the msg through to output #1. If verification fails (user unauthenticated), by default the node will redirect the request to the default login page at `<settings.httpNodeRoot>/users`. If the `custom error ouput handler` setting is enabled, the node will send the message to output #2 to be handled by a custom template node and http out node.

### Advanced settings

Clicking "show advanced settings" inside the users config tab will display extra settings for the JWT. These should be left alone unless you know what you're doing.

**JWT cookie name** - Name of the browser cookie used to store the json web token.

**JWT secret** - this is the key used to generated your json web token. Keep it safe, don't share it with your friends. You can use the "regenerate secret" button if you want to revoke any existing logged in users and make them re-login.

**JWT HTTPS only** - enable this if Node-RED is running under HTTPS. This will make sure the JWT cookie is only delivered over a secure HTTPS connection for improved security.

### Example flow

Below is an example flow that shows how to use the `is logged in` node to check if users hitting the `/demo` endpoint is authroized and route them to different pages depending on the scope set in the config or redirect to a custom login page is they are unauthorized. After importing the flow, you will need to create users in the `users` config tab on the right hand side of the Node-RED editor.

```
[{"id":"6fc26d12.d14de4","type":"users_isloggedin","z":"6b023dcb.e35df4","name":"","enableCustomHandler":true,"outputs":2,"x":250,"y":160,"wires":[["180aa8c2.9ff547"],["fe57678e.44aff8"]]},{"id":"36ab5d84.3acd82","type":"http in","z":"6b023dcb.e35df4","name":"","url":"/demo","method":"get","upload":false,"swaggerDoc":"","x":100,"y":160,"wires":[["6fc26d12.d14de4"]]},{"id":"c7b803fb.6f0c2","type":"template","z":"6b023dcb.e35df4","name":"for admins only","field":"payload","fieldType":"msg","format":"handlebars","syntax":"mustache","template":"<html>\n    <head>\n        <title>Node users demo</title>\n        <style>\n            * {\n                color: #fff;\n            }\n            h1 {\n                font-size: 120px;\n                color: #fff;\n                padding: 20px;\n            }\n        </style>\n    </head>\n    <body style=\"text-align: center; background: #010203;\">\n        <h1>WELCOME ADMIN !!!</h1>\n        <h2>User: {{payload.nodeUser.username}}</h2>\n        <h2>Scope: {{payload.nodeUser.scope}}</h2>\n    </body>\n</html>","x":680,"y":100,"wires":[["6a117cb1.362fb4"]]},{"id":"6a117cb1.362fb4","type":"http response","z":"6b023dcb.e35df4","name":"","statusCode":"","headers":{},"x":850,"y":100,"wires":[]},{"id":"69964e1d.8240b","type":"template","z":"6b023dcb.e35df4","name":"for allowed users only","field":"payload","fieldType":"msg","format":"handlebars","syntax":"mustache","template":"<html>\n    <head>\n        <title>Node users demo</title>\n        <style>\n            * {\n                color: #fff;\n            }\n            h1 {\n                font-size: 120px;\n                color: #fff;\n                padding: 20px;\n            }\n        </style>\n    </head>\n    <body style=\"text-align: center; background: #010203;\">\n        <h1>LOGIN SUCCESS !!!</h1>\n        <h2>User: {{payload.nodeUser.username}}</h2>\n        <h2>Scope: {{payload.nodeUser.scope}}</h2>\n    </body>\n</html>","x":660,"y":140,"wires":[["1e4e87c7.4e0c58"]]},{"id":"1e4e87c7.4e0c58","type":"http response","z":"6b023dcb.e35df4","name":"","statusCode":"","headers":{},"x":850,"y":140,"wires":[]},{"id":"180aa8c2.9ff547","type":"switch","z":"6b023dcb.e35df4","name":"check user scope","property":"payload.nodeUser.scope","propertyType":"msg","rules":[{"t":"eq","v":"admin","vt":"str"},{"t":"else"}],"checkall":"true","repair":false,"outputs":2,"x":450,"y":100,"wires":[["c7b803fb.6f0c2"],["69964e1d.8240b"]]},{"id":"fe57678e.44aff8","type":"template","z":"6b023dcb.e35df4","name":"custom login page","field":"payload","fieldType":"msg","format":"handlebars","syntax":"mustache","template":"<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n  <meta name=\"mobile-web-app-capable\" content=\"yes\">\n  <style>\n      * {\n  box-sizing: border-box;\n}\n\nhtml {\n  height: 100%;\n}\n\nbody {\n  margin: 0;\n  height: 100%;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n  font-size: 15px;\n  background: #000;\n}\n\n.form-group {\n  margin-bottom: 15px;\n}\n\n.form-group input {\n  width: 100%;\n  border-radius: 2px;\n\n  display: block;\n  width: 100%;\n  height: 34px;\n  padding: 6px 12px;\n  font-size: 14px;\n  line-height: 1.42857143;\n  color: #555;\n  outline: 0;\n  border: 1px solid #ddd;\n}\n\n.login-wrapper > a, button {\n  text-decoration: none;\n  cursor: pointer;\n  background-color: #00979C;\n  border: 1px solid #008d92;\n  color: #f3f5f6;\n  transition: color 0.2s, background-color 0.2s;\n\n  text-align: center;\n  padding: 12px 60px;\n  font-size: 1.2rem;\n  display: inline-block;\n  margin-bottom: 1rem;\n  border-radius: 2px;\n  background-color: #00979C;\n  font-weight: bold;\n  text-transform: uppercase;\n}\n\n.login-wrapper > a:hover, .login-wrapper > a:active,\nbutton:hover, button:active {\n  background-color: #00b5bb;\n  color: #f3f5f6;\n  border-color: #00abb0;\n}\n\n.login-wrapper {\n  position: absolute;\n  padding: 15px;\n  margin: 0 auto;\n  width: 400px;\n  color: #EFF0F1;\n  text-align: center;\n  left: calc(50% - 200px);\n  top: calc(50% - 180px);\n}\n\n.response {\n  margin-top: 10px;\n  padding: 15px;\n  color: #fff;\n  border-radius: 2px;\n}\n\n.response.success {\n  background-color: #51b385;\n  border-color: #63bb92;\n}\n\n.response.error {\n  background-color: #c11532;\n  border-color: #c11532;\n}\n\n@media (max-width: 768px) {\n  .login-wrapper {\n    width: 100%;\n    left: 0;\n    top: 100px;\n    padding: 15px 30px;\n  }\n}\n  </style>\n  <title>Node-RED Node Users</title>\n</head>\n<body>\n\n  <div class=\"login-wrapper\">\n    \n    <h1>Custom Users Login</h1>\n    <form id=\"login-form\">\n      <div class=\"form-group\">\n        <input type=\"text\" name=\"username\" placeholder=\"Username\"/>  \n      </div>\n      <div class=\"form-group\">\n        <input type=\"password\" name=\"password\" placeholder=\"Password\"/>  \n      </div>\n      <button type=\"submit\">Login</button>\n      <div class=\"response\"></div>\n    </form>\n\n  </div>\n    \n  <script src=\"http://code.jquery.com/jquery-3.3.1.min.js\"></script>\n  <script>\n    var responseTimer;\n\n    function showResponse(message, type) {\n      $(\".response\").text(message);\n      $(\".response\").removeClass(\"success\").removeClass(\"error\").addClass(type).show();\n\n      clearTimeout(responseTimer);\n      responseTimer = setTimeout(function () {\n        $(\".response\").fadeOut();\n      }, 4000);\n    }\n\n    function getParameterByName(name) {\n      var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);\n      return match && decodeURIComponent(match[1].replace(/\\+/g, ' '));\n    }\n\n    $(\"#login-form\").submit(function (e) {\n      e.preventDefault();\n      var username = $(this).find(\"input[name=username]\").val();\n      var password = $(this).find(\"input[name=password]\").val();\n      var cred = {\n        username: username,\n        password: password\n      };\n      $.post('/users', cred).done(function () {\n        showResponse(\"Login success! Redirecting...\", \"success\");\n        setTimeout(function () {\n            window.location = '/demo';  \n        }, 2000);        \n      }).fail(function (xhr) {\n        var msg = \"\";\n        switch(xhr.status) {\n          case 0:\n            msg = \"Failed to connect with server.\";\n            break;\n          case 401: \n            msg = \"Unauthorized: username and password not found\";\n            break;\n          default: \n            msg = \"Server error: oops.. something went wrong...\";\n        }\n        showResponse(msg, \"error\");\n      });\n    });\n  </script>\n\n</body>\n</html>","x":470,"y":260,"wires":[["6dc8c8e9.f9cf68"]]},{"id":"6dc8c8e9.f9cf68","type":"http response","z":"6b023dcb.e35df4","name":"","statusCode":"","headers":{},"x":650,"y":260,"wires":[]},{"id":"de2fa558.e7ad08","type":"comment","z":"6b023dcb.e35df4","name":"User unauthorized, show login page","info":"","x":520,"y":220,"wires":[]},{"id":"dd50fd1a.43eb2","type":"comment","z":"6b023dcb.e35df4","name":"User authorized, allow through","info":"","x":480,"y":60,"wires":[]}]
```

## FAQ

### How does it work?

When the user logs in, the node will check the username and password provided with the allowed users list set in the users config. If a matching user is found, a json web token (JWT) will be created with the username and scope field in the payload. The JWT is stored in the cookie and can be accessed by other nodes. 

The `is logged in` node checks the incoming request for the JWT cookie and verifies it with the JWT secret in the config. If the token exist and passes the verification, the JWT payload consisting of "username" and "scope" is attached to msg.req.user and msg.payload.user and passed through. If the JWT does not exist or fails to verify, depending on the config, the user is redirected to the default login page or routed to custom page specified in the flow. 

### Is it secure?

Json web token (JWT) is a secure and industry standard [RFC719](https://tools.ietf.org/html/rfc7519) in representing claims between two parties. As long as the token passes verification, you can be sure that the contents of the JWT payload hasn't been tampered with. You can read more about JWT and how it's used here:

[Introduction to JSON Web Tokens](https://jwt.io/introduction)

[5 Easy Steps to Understanding JSON Web Tokens (JWT)](https://medium.com/vandium-software/5-easy-steps-to-understanding-json-web-tokens-jwt-1164c0adfcec)

We use this popular nodejs library to generate our tokens: https://www.npmjs.com/package/jsonwebtoken. Enabling the https only option in users config for JWT is recommended if hosting Node-RED under https. Do not sure any sensitive information in the scope user field since the JWT itself is not encrypted.

### How are the passwords stored?

The user passwords are salted and hashed on input and stored in the standard Node-RED credential flow file where they can be optionally encrypted.

### Does this node have anything to do with the default Node-RED users login?

No. The Node-RED users login manages access to the editor and admin API while this node helps you manages access to the http endpoints created your flows. We expect the Node-RED users/admin login will be used alongside this node to secure access to the Node-RED editor.

### Can I customize the default login page or change the URL?

Not for now. However, you can create your own login page and endpoint using the template function node and call the appropriate POST endpoint to authenticate user (see below).

### Can I use my own login page?

Yes, you can create a custom login page using the template node. You will need to POST to `/users` with `username` and `password` in the request body. See below for jQuery ajax example.

```
$.post('/users', {username: "<USERNAME>", password: "<PASSWORD>"}).done(function () {
  // login success, redirect to somewhere else
  window.location = '<SOME_CUSTOM_LANDING_PAGE>'
}).fail(function (xhr) {
  // login failed, handle error
  someErrorHandler(xhr);
});
```

### Can I add other fields to the JWT payload?

Not yet.

### How do I integrate this with an existing user system?

For now, you can't.

In the future, we plan to implement other authentication methods that the node can be configured to use instead of the default users white list implementation. One possible idea is to provide a configurable web hook endpoint that the node will call with the username and password on login in order to authenticate the user using some external service. Some oauth integration is another possibility.

### Can I use this with other nodes such as the Node-RED dashboard to provide authentication?

Theoretically yes, but some hacking will be required. The plan is to make it easy to add the same `is logged in` style middleware check to other nodes that host http endpoints so it can leverage this node for authenticating users.
