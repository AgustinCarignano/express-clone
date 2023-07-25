# Express Clone

## Introduction

Express Clone is a functional clone of the popular Node.js web application framework, Express. This project was created by [Agustin Carignano](https://github.com/AgustinCarignano) and [Mario Herrero](https://github.com/GrumpyArdias), with the aim of providing developers with a lightweight, flexible, and easy-to-use framework for building web applications in Node.js.

## ⚠️ Development Notice

**Please Note:** This repository is currently under development. It may contain bugs, incomplete features, or undocumented behavior.

## Features

- **Routing:** Express Clone supports a robust routing system similar to Express, allowing developers to define various routes and handle HTTP methods like **GET**, **POST**, **PUT**, **DELETE**, etc.

- **Middleware**: Implement middleware functions to perform tasks such as authentication, logging, error handling, and more. Middleware can be applied globally or to specific routes.

- **Request and Response Objects:** Access and manipulate the request and response objects to handle incoming requests and send appropriate responses.

- **Static File Serving:** Serve static files like CSS, JavaScript, and images to the client with ease. **IN PROGRESS**

## Getting Started

To get started with Express Clone, follow these steps:

1. Clone the repository from [Git Clone](https://github.com/GrumpyArdias/express-clone).

2. Install the dependencies using `npm install`.

3. Create your web application by defining routes in the `app.js` file.

4. Run your application using `npm start`.

## Example

```javascript
import { express } from "./main.js";

const myMiddleware = (req, res, next) => {
    console.log("executing middleware");
    next();
};

app.use("/", myMiddleware);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/:id", (req, res) => {
    const id = req.params.id;
    res.json({id});
});

app.listen(3000, () => {
    console.log("Listening on port 3000");

});

 ```

## Contact

If you have any questions or need support, feel free to reach out to Agustin Carignano or Mario Herrero via their GitHub profiles.

- [Agustin Carignano](https://github.com/AgustinCarignano) 
- [Mario Herrero](https://github.com/GrumpyArdias)