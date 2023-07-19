import * as http from "http";
import { URL } from "url";
import * as querystring from "querystring";
import * as fs from "fs";
import * as path from "path";

export const expess = () => {
  const app = {};

  const get = {
    handler: [],
    path: [],
  };

  const middlewareStack = [];

  app.listen = (port, callback) => {
    const server = http.createServer(requestHandler);
    server.listen(port, (err) => {
      callback(err);
    });
  };

  app.get = (path, handler) => {
    get.handler.push(handler);

    if (path.includes("/")) {
      let urlPath = path.split(":")[0];
      urlPath = urlPath.substring(0, urlPath.length - 1);
      get.path.push(urlPath);
    } else {
      get.path.push(path);
    }
  };

  app.use = (path, middleware) => {
    if (typeof path === "function") {
      middleware = path;
      path = undefined;
    }
    middlewareStack.push({
      path,
      middleware,
    });
  };

  function manageRouteHandler(req, res) {
    const method = req.method;
    const url = req.url;
    const parsedUrl = req.parse(url);
    const paredQuery = querystring.parse(parsedUrl.query);

    req.query = paredQuery;

    if (method === "GET" && get.path.includes(parsedUrl.pathname)) {
      const handlerIndex = get.path.indexOf(parsedUrl.pathname);
      get.handler[handlerIndex](req, res);
    } else {
      res.statusCode(404);
      res.end("Cannot ${method} ${url}");
    }
  }

  const requestHandler = (req, res) => {
    function getContentType(filename) {
      switch (filename.split(".").pop()) {
        case "html":
          return "text/html";
        case "css":
          return "text/css";
        case "js":
          return "text/javascript";
        case "jpg":
          return "image/jpg";
        case "png":
          return "image/png";
        default:
          return "application/octet-stream";
      }
    }
    res.send = (response) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(`<p>${response}</p>`);
      res.send();
    };
    res.sendFile = (pathOfFile) => {
      const contentType = getContentType(pathOfFile);

      fs.readFile(pathOfFile, (err, data) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
        } else {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(data);
        }
      });
    };

    res.redirect = (route) => {
      res.writeHead(301, { Location: route });
      res.end();
    };
    manageRouteHandler(req, res);
  };

  return app;
};
