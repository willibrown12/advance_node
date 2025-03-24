process.env.UV_THREADPOOL_SIZE = 1;
const worker = require("worker_threads").worker;

app.get("/", (req, res, next) => {
  const worker = new worker(function () {
    this.onmessage = function () {
      let counter = 0;
      while (counter < 1e9) {
        counter++;
      }

      postMessage(counter);
    };
  });

  worker.onmessage = function (massage) {
    console.log(massage.data);
    res.send(""+massage.data)
    
  };

  worker.postMessage();
});

app.get("/fast", (req, res, next) => {
  res.send("this was fast");
});
app.listen(3000);
