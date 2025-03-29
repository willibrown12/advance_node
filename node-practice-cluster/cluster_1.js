process.env.UV_THREADPOOL_SIZE = 1;
const cluster = require("cluster");

if (cluster.isMaster) {
  // cause index.js to be executed *again* but in child mode
  cluster.fork();
} else {
  const express = require("express");
  const crypto = require("crypto");
  const app = express();

  //   function doWork(duration) {
  //     const start = Date.now();
  //     while (Date.now() - start < duration) {}
  //   }

  app.get("/", (req, res, next) => {
    // doWork(5000);
    crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
      res.send("hi there");
    });
  });

  app.get("/fast", (req, res, next) => {
    res.send("this was fast");
  });
  app.listen(3000);
}
