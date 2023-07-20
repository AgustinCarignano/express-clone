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
      urlPath = urlPath.slice(0, urlPath.length);
      get.path.push(urlPath);
      get.params.push({
        name: param,
        basePath: urlPath,
        index: get.path.length - 1,
      });
    } else {
      get.path.push(path);
    }
    console.log(get);
  };

  app.post = (path, handler) => {
    post.handler.push(handler);

    if (path.includes("/:")) {
      let urlPath = path.split(":")[0];
      let param = (urlPath = urlPath.substring(0, urlPath.length - 1));
      post.path.push(urlPath);
    } else {
      post.path.push(path);
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

  app.use(estatico(__dirname + "/public"));

  function manageRouteHandler(req, res) {
    const method = req.method;
    const url = req.url;
    const parsedUrl = URL.parse(url);
    const paredQuery = querystring.parse(parsedUrl.query);

    // const id = req.url.split("/")[1];
    // console.log(id);
    req.query = paredQuery;

    if (method === "GET") {
      if (get.path.includes(parsedUrl.pathname)) {
        const handlerIndex = get.path.indexOf(parsedUrl.pathname);
        get.handler[handlerIndex](req, res);
      } else {
        let [basePath, param] = parsedUrl.pathname.split("/");
        if (basePath.length === 0) basePath = "/";
        console.log(basePath, param);
        const matchParams = get.params.find(
          (item) => item.basePath === basePath
        );
        if (matchParams) {
          req.params = { [matchParams.name]: param };
          get.handler[matchParams.index](req, res);
        }
      }
    } else if (method === "POST" && post.path.includes(parsedUrl.pathname)) {
      const handlerIndex = post.path.indexOf(parsedUrl.pathname);
      post.handler[handlerIndex](req, res);
    } else {
      res.statusCode = 404;
      res.end("Cannot ${method} ${url}");
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
