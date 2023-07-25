export function routerExecutor(methods, req, res) {
    let bodyArr = [];
    if (!req.listenerCount("data")) {
        req.on("data", (chunk) => {
            bodyArr.push(chunk);
        });
    }
    if (req.method === "GET" || req.method === "DELETE") {
        if (methods[req.method].path.includes(req.pathname)) {
            const handlerIndex = methods[req.method].path.indexOf(req.pathname);
            methods[req.method].handler[handlerIndex](req, res);
        } else {
            let pathArr = req.pathname.split("/");
            let basePath = pathArr.splice(0, pathArr.length - 1).join("/");
            let param = pathArr[pathArr.length - 1];
            basePath += "/";
            const matchParams = methods[req.method].params.find((item) => item.basePath === basePath);
            if (matchParams) {
                req.params = { [matchParams.name]: param };
                methods[req.method].handler[matchParams.index](req, res);
            } else {
                res.statusCode = 404;
                res.end(`Cannot ${req.method} ${req.url}`);
            }
        }
    } else if (req.method === "POST" || req.method === "PUT") {
        if (methods[req.method].path.includes(req.pathname)) {
            const handlerIndex = methods[req.method].path.indexOf(req.pathname);
            if (!req.listenerCount("end")) {
                req.on("end", () => {
                    bodyArr = Buffer.concat(bodyArr).toString();
                    req.body = bodyArr ? JSON.parse(bodyArr) : undefined;

                    methods[req.method].handler[handlerIndex](req, res);
                });
            }
        } else {
            let pathArr = req.pathname.split("/");
            let basePath = pathArr.splice(0, pathArr.length - 1).join("/");
            let param = pathArr[pathArr.length - 1];
            basePath += "/";
            const matchParams = methods[req.method].params.find((item) => item.basePath === basePath);
            if (matchParams) {
                req.params = { [matchParams.name]: param };
                if (!req.listenerCount("end")) {
                    req.on("end", () => {
                        bodyArr = Buffer.concat(bodyArr).toString();
                        req.body = bodyArr ? JSON.parse(bodyArr) : undefined;
                        methods[req.method].handler[matchParams.index](req, res);
                    });
                }
            } else {
                res.statusCode = 404;
                res.end(`Cannot ${req.method} ${req.url}`);
            }
        }
    } else {
        res.statusCode = 404;
        res.end(`Cannot ${req.method} ${req.url}`);
    }
}
