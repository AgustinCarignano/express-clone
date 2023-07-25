import * as http from "http";
import { URL } from "url";
import * as querystring from "querystring";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { routerExecutor } from "./routerExecutor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const express = () => {
    const app = {};

    const methods = {
        GET: {
            handler: [],
            path: [],
            params: [],
        },
        POST: {
            handler: [],
            path: [],
            params: [],
        },
        PUT: {
            handler: [],
            path: [],
            params: [],
        },
        DELETE: {
            handler: [],
            path: [],
            params: [],
        },
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

    function defineMethod(method, path, handler) {
        methods[method].handler.push(handler);
        if (path.includes("/:")) {
            let [urlPath, param] = path.split(":");
            methods[method].path.push(urlPath);
            methods[method].params.push({
                name: param,
                basePath: urlPath,
                index: methods[method].path.length - 1,
            });
        } else {
            methods[method].path.push(path);
        }
    }

    app.get = (path, handler) => {
        defineMethod("GET", path, handler);
    };

    app.post = (path, handler) => {
        defineMethod("POST", path, handler);
    };

    app.put = (path, handler) => {
        defineMethod("PUT", path, handler);
    };

    app.delete = (path, handler) => {
        defineMethod("DELETE", path, handler);
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
        const baseURL = req.protocol + "://" + req.headers.host + "/";
        const url = req.url;
        const parsedUrl = new URL(url, baseURL);
        const paredQuery = querystring.parse(parsedUrl.query);
        req.pathname = parsedUrl.pathname;
        req.query = paredQuery;

        routerExecutor(methods, req, res);
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
                    handleMiddleware(req, res, index + 1);
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
        // manageRouteHandler(req, res);
        handleMiddleware(req, res, 0);
    };

    return app;
};
