# node-red-contrib-users

## Overview

The goal of this node is to allow users to quickly build a very simple user system to control access to your http nodes on Node-RED. The basic use case is if you (the Node-RED admin) want to open an `http in` endpoint in your flow that can only be accessed by a list of users that you configure and also be able to serve different responses depending on the username or a custom "scope" field of the user who is logged in.

## Installation and Usage

1. Go to your Node-RED users directory and run: `npm install node-red-contrib-users`
2. Start Node-RED
3. Create the allowed users list by going to the "users" tab on the right hand side of the Node-RED editor. Add users by filling in the username, password and scope (optional) and clicking the "Add user to whitelist" button. You can remove users by clicking the [x] button next to their username in the list.
4. Deploy the flow.

You should now be able to access `<settings.httpNodeRoot>/users` and see the default login page. See example flow below.

**isLoggedIn node**

The `is logged in` node acts like a middleware that check and verifies the json web token (JWT) in the incoming request. It expects req and res objects in the msg input, usually from a `http in` node.

If the JWT successfully passes verification, the node will add the JWT payload (username and scope) to the msg.payload.user and msg.req.user objects and pass the msg through to output #1. If verification fails (user unauthenticated), by default the node will redirect the request to the default login page at `<settings.httpNodeRoot>/users`. If the `custom error ouput handler` setting is enabled, the node will send the message to output #2 to be handled by a custom template node and http out node.

### Advanced settings

Clicking "show advanced settings" inside the users config tab will display extra settings for the JWT. These should be left alone as it is unless you know what you're doing.

**JWT cookie name** - Name of the browser cookie used to store the json web token.

**JWT secret** - this is the key used to generated your json web token. Keep it safe, don't share it with your friends. You can use the "regenerate secret" button if you want to revoke any existing logged in users and make them re-login.

**JWT HTTPS only** - enable this if Node-RED is running under HTTPS. This will make sure the JWT cookie is only delivered over a secure HTTPS connection for improved security.

### Example flow

Below is an example flow that shows how to use the `is logged in` node to check if users hitting the `/demo` endpoint is authroized and route them to different pages depending on the scope set in the config or redirect to a custom login page is they are unauthorized. After importing the flow, you will need to create users in the `users` config tab on the right hand side of the Node-RED editor.

```
[{"id":"ac2eb44d.956658","type":"tab","label":"Flow 1","disabled":false,"info":""},{"id":"6f8f55cd.50472c","type":"users_config","jwtCookieName":"nr.nodeUsers.jwt"},{"id":"89df4251.7ec3e","type":"ui_base","theme":{"name":"theme-light","lightTheme":{"default":"#0094CE","baseColor":"#0094CE","baseFont":"-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif","edited":true,"reset":false},"darkTheme":{"default":"#097479","baseColor":"#097479","baseFont":"-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif","edited":false},"customTheme":{"name":"Untitled Theme 1","default":"#4B7930","baseColor":"#4B7930","baseFont":"-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif"},"themeState":{"base-color":{"default":"#0094CE","value":"#0094CE","edited":false},"page-titlebar-backgroundColor":{"value":"#0094CE","edited":false},"page-backgroundColor":{"value":"#fafafa","edited":false},"page-sidebar-backgroundColor":{"value":"#ffffff","edited":false},"group-textColor":{"value":"#1bbfff","edited":false},"group-borderColor":{"value":"#ffffff","edited":false},"group-backgroundColor":{"value":"#ffffff","edited":false},"widget-textColor":{"value":"#111111","edited":false},"widget-backgroundColor":{"value":"#0094ce","edited":false},"widget-borderColor":{"value":"#ffffff","edited":false},"base-font":{"value":"-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif"}}},"site":{"name":"Node-RED Dashboard","hideToolbar":"false","allowSwipe":"false","dateFormat":"DD/MM/YYYY","sizes":{"sx":48,"sy":48,"gx":6,"gy":6,"cx":6,"cy":6,"px":0,"py":0}}},{"id":"51c12371.8a083c","type":"ui_tab","z":"","name":"Home","icon":"dashboard"},{"id":"280485e1.4f18ba","type":"ui_group","z":"","name":"Default","tab":"51c12371.8a083c","disp":true,"width":"6"},{"id":"be244b73.cbf568","type":"users_isloggedin","z":"ac2eb44d.956658","name":"","enableCustomHandler":true,"outputs":2,"x":250,"y":160,"wires":[["e4efdf26.bd973"],["3b2c57ed.808a58"]]},{"id":"719c3c6f.bdcd44","type":"http in","z":"ac2eb44d.956658","name":"","url":"/demo","method":"get","upload":false,"swaggerDoc":"","x":100,"y":160,"wires":[["be244b73.cbf568"]]},{"id":"6a42c554.4b1c8c","type":"template","z":"ac2eb44d.956658","name":"for admins only","field":"payload","fieldType":"msg","format":"handlebars","syntax":"mustache","template":"<html>\n    <head>\n        <title>Node users demo</title>\n        <style>\n            * {\n                color: #fff;\n            }\n            h1 {\n                font-size: 120px;\n                color: #fff;\n                padding: 20px;\n            }\n        </style>\n    </head>\n    <body style=\"text-align: center; background: #010203;\">\n        <h1>WELCOME ADMIN !!!</h1>\n        <h2>User: {{payload.nodeUser.username}}</h2>\n        <h2>Scope: {{payload.nodeUser.scope}}</h2>\n    </body>\n</html>","x":680,"y":100,"wires":[["83af6349.b69e4"]]},{"id":"83af6349.b69e4","type":"http response","z":"ac2eb44d.956658","name":"","statusCode":"","headers":{},"x":850,"y":100,"wires":[]},{"id":"ba884886.3bb038","type":"template","z":"ac2eb44d.956658","name":"for allowed users only","field":"payload","fieldType":"msg","format":"handlebars","syntax":"mustache","template":"<html>\n    <head>\n        <title>Node users demo</title>\n        <style>\n            * {\n                color: #fff;\n            }\n            h1 {\n                font-size: 120px;\n                color: #fff;\n                padding: 20px;\n            }\n        </style>\n    </head>\n    <body style=\"text-align: center; background: #010203;\">\n        <h1>LOGIN SUCCESS !!!</h1>\n        <h2>User: {{payload.nodeUser.username}}</h2>\n        <h2>Scope: {{payload.nodeUser.scope}}</h2>\n    </body>\n</html>","x":660,"y":140,"wires":[["9b64463d.793428"]]},{"id":"9b64463d.793428","type":"http response","z":"ac2eb44d.956658","name":"","statusCode":"","headers":{},"x":850,"y":140,"wires":[]},{"id":"e4efdf26.bd973","type":"switch","z":"ac2eb44d.956658","name":"check user scope","property":"payload.nodeUser.scope","propertyType":"msg","rules":[{"t":"eq","v":"admin","vt":"str"},{"t":"else"}],"checkall":"true","repair":false,"outputs":2,"x":450,"y":100,"wires":[["6a42c554.4b1c8c"],["ba884886.3bb038"]]},{"id":"3b2c57ed.808a58","type":"template","z":"ac2eb44d.956658","name":"custom login page","field":"payload","fieldType":"msg","format":"handlebars","syntax":"mustache","template":"<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n  <meta name=\"mobile-web-app-capable\" content=\"yes\">\n  <style>\n      * {\n  box-sizing: border-box;\n}\n\nhtml {\n  height: 100%;\n}\n\nbody {\n  margin: 0;\n  height: 100%;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n  font-size: 15px;\n  background: #000;\n}\n\n.form-group {\n  margin-bottom: 15px;\n}\n\n.form-group input {\n  width: 100%;\n  border-radius: 2px;\n\n  display: block;\n  width: 100%;\n  height: 34px;\n  padding: 6px 12px;\n  font-size: 14px;\n  line-height: 1.42857143;\n  color: #555;\n  outline: 0;\n  border: 1px solid #ddd;\n}\n\n.login-wrapper > a, button {\n  text-decoration: none;\n  cursor: pointer;\n  background-color: #00979C;\n  border: 1px solid #008d92;\n  color: #f3f5f6;\n  transition: color 0.2s, background-color 0.2s;\n\n  text-align: center;\n  padding: 12px 60px;\n  font-size: 1.2rem;\n  display: inline-block;\n  margin-bottom: 1rem;\n  border-radius: 2px;\n  background-color: #00979C;\n  font-weight: bold;\n  text-transform: uppercase;\n}\n\n.login-wrapper > a:hover, .login-wrapper > a:active,\nbutton:hover, button:active {\n  background-color: #00b5bb;\n  color: #f3f5f6;\n  border-color: #00abb0;\n}\n\n.login-wrapper {\n  position: absolute;\n  padding: 15px;\n  margin: 0 auto;\n  width: 400px;\n  color: #EFF0F1;\n  text-align: center;\n  left: calc(50% - 200px);\n  top: calc(50% - 180px);\n}\n\n.response {\n  margin-top: 10px;\n  padding: 15px;\n  color: #fff;\n  border-radius: 2px;\n}\n\n.response.success {\n  background-color: #51b385;\n  border-color: #63bb92;\n}\n\n.response.error {\n  background-color: #c11532;\n  border-color: #c11532;\n}\n\n@media (max-width: 768px) {\n  .login-wrapper {\n    width: 100%;\n    left: 0;\n    top: 100px;\n    padding: 15px 30px;\n  }\n}\n  </style>\n  <title>Node-RED Node Users</title>\n</head>\n<body>\n\n  <div class=\"login-wrapper\">\n    \n    <h1>Custom Users Login</h1>\n    <form id=\"login-form\">\n      <div class=\"form-group\">\n        <input type=\"text\" name=\"username\" placeholder=\"Username\"/>  \n      </div>\n      <div class=\"form-group\">\n        <input type=\"password\" name=\"password\" placeholder=\"Password\"/>  \n      </div>\n      <button type=\"submit\">Login</button>\n      <div class=\"response\"></div>\n    </form>\n\n  </div>\n    \n  <script src=\"http://code.jquery.com/jquery-3.3.1.min.js\"></script>\n  <script>\n    var responseTimer;\n\n    function showResponse(message, type) {\n      $(\".response\").text(message);\n      $(\".response\").removeClass(\"success\").removeClass(\"error\").addClass(type).show();\n\n      clearTimeout(responseTimer);\n      responseTimer = setTimeout(function () {\n        $(\".response\").fadeOut();\n      }, 4000);\n    }\n\n    function getParameterByName(name) {\n      var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);\n      return match && decodeURIComponent(match[1].replace(/\\+/g, ' '));\n    }\n\n    $(\"#login-form\").submit(function (e) {\n      e.preventDefault();\n      var username = $(this).find(\"input[name=username]\").val();\n      var password = $(this).find(\"input[name=password]\").val();\n      var cred = {\n        username: username,\n        password: password\n      };\n      $.post('/users', cred).done(function () {\n        showResponse(\"Login success! Redirecting...\", \"success\");\n        setTimeout(function () {\n            window.location = '/demo';  \n        }, 2000);        \n      }).fail(function (xhr) {\n        var msg = \"\";\n        switch(xhr.status) {\n          case 0:\n            msg = \"Failed to connect with server.\";\n            break;\n          case 401: \n            msg = \"Unauthorized: username and password not found\";\n            break;\n          default: \n            msg = \"Server error: oops.. something went wrong...\";\n        }\n        showResponse(msg, \"error\");\n      });\n    });\n  </script>\n\n</body>\n</html>","x":470,"y":260,"wires":[["c6c91d52.87fce"]]},{"id":"c6c91d52.87fce","type":"http response","z":"ac2eb44d.956658","name":"","statusCode":"","headers":{},"x":650,"y":260,"wires":[]},{"id":"e0a22536.700388","type":"comment","z":"ac2eb44d.956658","name":"User unauthorized, show login page","info":"","x":520,"y":220,"wires":[]},{"id":"f472ea25.f6fd38","type":"comment","z":"ac2eb44d.956658","name":"User authorized, allow through","info":"","x":480,"y":60,"wires":[]}]
```

## FAQ

### How does it work?

When the user logs in, the node will check the username and password provided with the allowed users list set in the users config. If a matching user is found, a json web token (JWT) will be created with the username and scope field in the payload. The JWT is stored in the cookie and can be accessed by other nodes. 

The `is logged in` node checks the incoming request for the JWT cookie and verifies it with the JWT secret in the config. If the token exist and passes the verification, the JWT payload consisting of "username" and "scope" is attached to msg.req.user and msg.payload.user and passed through. If the JWT does not exist or fails to verify, depending on the config, the user is redirected to the default login page or routed to custom page specified in the flow. 

### Is it secure?

We use the popular node library for JWT to generate our tokens: https://www.npmjs.com/package/jsonwebtoken. Enabling the enabling https only option in users config for JWT is recommended if hosting under https.

The passwords are salted and hashed on input and stored in the standard Node-RED credential flow file where they can be optionally encrypted.

You can read more about JSON Web Tokens (JWT) and how it works here:

https://jwt.io/introduction

https://medium.com/vandium-software/5-easy-steps-to-understanding-json-web-tokens-jwt-1164c0adfcec


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
