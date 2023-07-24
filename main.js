import * as http from "http";
import * as URL from "url";
import * as querystring from "querystring";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const express = () => {
  const app = {};

  const get = {
    handler: [],
    path: [],
    params: [],
  };

  const post = {
    handler: [],
    path: [],
    params: [],
  };
  const _delete = {
    handler: [],
    path: [],
    params: [],
  };

  const update = {
    handler: [],
    path: [],
    params: [],
  };

  const middlewareStack = [];

  const estatico = (directoryPath) => {
    return function (req, res, next) {
      const filePath = path.join(directoryPath, req.url);
      const fileStream = fs.createReadStream(filePath);

      fileStream.on("error", () => {
        next();
      });
      fileStream.pipe(res);
    };
  };

  app.listen = (port, callback) => {
    const server = http.createServer(requestHandler);
    server.listen(port, (err) => {
      callback(err);
    });
  };

  app.get = (path, handler) => {
    get.handler.push(handler);

    if (path.includes("/:")) {
      let [urlPath, param] = path.split(":");
      get.path.push(urlPath);
      get.params.push({
        name: param,
        basePath: urlPath,
        index: get.path.length - 1,
      });
    } else {
      get.path.push(path);
    }
  };

  app.post = (path, handler) => {
    post.handler.push(handler);

    if (path.includes("/:")) {
      let [urlPath, param] = path.split(":");
      post.path.push(urlPath);
      post.params.push({
        name: param,
        basePath: urlPath,
        index: post.path.length - 1,
      });
    } else {
      post.path.push(path);
    }
  };

  app.delete = (path, handler) => {
    _delete.handler.push(handler);

    if (path.includes("/:")) {
      let [urlPath, param] = path.split(":");
      _delete.path.push(urlPath);
      _delete.params.push({
        name: param,
        basePath: urlPath,
        index: _delete.path.length - 1,
      });
    } else {
      _delete.path.push(path);
    }
  };

  app.update = (path, handler) => {
    update.handler.push(handler);
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

  app.use(estatico(__dirname + "/public"));

  function manageRouteHandler(req, res) {
    const method = req.method;
    const url = req.url;
    const parsedUrl = URL.parse(url);
    const paredQuery = querystring.parse(parsedUrl.query);
    req.query = paredQuery;

    let bodyArr = [];

    if (!req.listenerCount("data")) {
      req.on("data", (chunk) => {
        bodyArr.push(chunk);
      });
    }

    switch (method) {
      case "GET":
        if (get.path.includes(parsedUrl.pathname)) {
          const handlerIndex = get.path.indexOf(parsedUrl.pathname);
          get.handler[handlerIndex](req, res);
        } else {
          let pathArr = parsedUrl.pathname.split("/");
          let basePath = pathArr.splice(0, pathArr.length - 1).join("/");
          let param = pathArr[pathArr.length - 1];
          basePath += "/";
          const matchParams = get.params.find(
            (item) => item.basePath === basePath
          );
          if (matchParams) {
            req.params = { [matchParams.name]: param };
            get.handler[matchParams.index](req, res);
          } else {
            res.statusCode = 404;
            res.end(`Cannot ${method} ${url}`);
          }
        }
        break;
      case "POST":
        if (post.path.includes(parsedUrl.pathname)) {
          const handlerIndex = post.path.indexOf(parsedUrl.pathname);
          if (!req.listenerCount("end")) {
            req.on("end", () => {
              bodyArr = Buffer.concat(bodyArr).toString();
              req.body = JSON.parse(bodyArr);

              post.handler[handlerIndex](req, res);
            });
          }
        } else {
          let pathArr = parsedUrl.pathname.split("/");
          let basePath = pathArr.splice(0, pathArr.length - 1).join("/");
          let param = pathArr[pathArr.length - 1];
          basePath += "/";
          const matchParams = post.params.find(
            (item) => item.basePath === basePath
          );
          if (matchParams) {
            req.params = { [matchParams.name]: param };
            if (!req.listenerCount("end")) {
              req.on("end", () => {
                bodyArr = Buffer.concat(bodyArr).toString();
                req.body = JSON.parse(bodyArr);
                post.handler[matchParams.index](req, res);
              });
            }
          } else {
            res.statusCode = 404;
            res.end(`Cannot ${method} ${url}`);
          }
        }
        break;
      case "DELETE":
        if (_delete.path.includes(parsedUrl.pathname)) {
          const handlerIndex = _delete.path.indexOf(parsedUrl.pathname);
          _delete.handler[handlerIndex](req, res);
        } else {
          let pathArr = parsedUrl.pathname.split("/");
          let basePath = pathArr.splice(0, pathArr.length - 1).join("/");
          let param = pathArr[pathArr.length - 1];
          basePath += "/";
          const matchParams = _delete.params.find(
            (item) => item.basePath === basePath
          );
          if (matchParams) {
            req.params = { [matchParams.name]: param };
            _delete.handler[matchParams.index](req, res);
          } else {
            res.statusCode = 404;
            res.end(`Cannot ${method} ${url}`);
          }
        }
        break;
      default:
        res.statusCode = 404;
        res.end(`Cannot ${method} ${url}`);
        break;
    }
  }

  function handleMiddleware(req, res, index) {
    if (index === middlewareStack.length) {
      manageRouteHandler(req, res);
      return;
    } else {
      if (middlewareStack[index].path) {
        if (middlewareStack[index].path === req.url) {
          const middlewareFunction = middlewareStack[index].middleware;
          middlewareFunction(req, res, () => {
            handleMiddleware(req, res, index + 1);
          });
        } else {
          middlewareHandler(req, res, index + 1);
        }
      } else {
        const middlewareFunction = middlewareStack[index].middleware;
        middlewareFunction(req, res, () => {
          handleMiddleware(req, res, index + 1);
        });
      }
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
      res.write(`${response}`);
      res.end();
    };
    res.json = (response) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.write(`${JSON.stringify(response)}`);
      res.end();
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
    handleMiddleware(req, res, 0);
  };

  return app;
};
