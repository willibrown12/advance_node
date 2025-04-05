const mongoose = require("mongoose");
const { createClient } = require("redis");

const redisURL = "redis://127.0.0.1:6379";
const client = createClient({ url: redisURL });

client.on("error", (err) => console.error("Redis Client Error", err));
const exec = mongoose.Query.prototype.exec;


mongoose.Query.prototype.cache = function() {
  this.useCache = true;
  return this;
};

// Ensure connection is successful before interacting with Redis
(async () => {
  try {
    await client.connect();
    console.log("Connected to Redis successfully!");
  } catch (error) {
    console.error("Redis connection error:", error);
  }
})();

mongoose.Query.prototype.exec = async function () {

 if (!this.useCache){
  return exec.apply (this,arguments)
 }
  console.log("im about to run a query");

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );
  console.log(key);

  const cacheValue = await client.get(key);

  if (cacheValue) {
   const doc = JSON.parse(cacheValue);

   return Array.isArray(doc)
   ? doc.map(d=> new this.model(d))
   : new this.model(doc) 

  }

  const result = await exec.apply(this, arguments);

  client.set(key, JSON.stringify(result),'EX',10);
  return result;
};

async function cacheQuery(query) {
  if (!(query instanceof mongoose.Query)) {
    throw new Error("cacheQuery must be called with a Mongoose query");
  }

  const key = JSON.stringify({
    query: query.getQuery(),
    collection: query.mongooseCollection.name,
  });

  // Check cache
  const cacheValue = await client.get(key);
  if (cacheValue) {
    return JSON.parse(cacheValue);
  }

  // Execute query if not cached
  const result = await query.exec();

  // Store result in cache
  // await client.set(key, JSON.stringify(result), "EX", ttl);

  return result;
}
