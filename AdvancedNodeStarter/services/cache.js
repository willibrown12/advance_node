const mongoose = require("mongoose");
const { createClient } = require("redis");

const redisURL = "redis://127.0.0.1:6379";
const client = createClient({ url: redisURL });

client.on("error", (err) => console.error("Redis Client Error", err));
const exec = mongoose.Query.prototype.exec;


mongoose.Query.prototype.cache = function(options= {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key ||"")
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


  const cacheValue = await client.hGet(this.hashKey ,key);

  if (cacheValue) {
    console.log("cache");
   const doc = JSON.parse(cacheValue);

   return Array.isArray(doc)
   ? doc.map(d=> new this.model(d))
   : new this.model(doc) 

  }

  const result = await exec.apply(this, arguments);

  await client.hSet(this.hashKey, key, JSON.stringify(result));
  await client.expire(this.hashKey, 10);
  return result;
};

module.exports={
  clearHash(hashKey){
    console.log("clearing");
    
    client.del(JSON.stringify(hashKey))
  }
}