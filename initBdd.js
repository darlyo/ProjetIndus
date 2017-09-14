/* var redis = require("redis")
  , subscriber = redis.createClient()
  , subToken = redis.createClient()
	, client = redis.createClient(); */
var redis = require('./redis.js')


function initBdd()
{
	console.log("**********************************");
	console.log("********** Creation BDD **********");
	console.log("**********************************");
	redis.init(true);

	redis.createUser("paul","paul",2);
	redis.createUser("admin","admin",1);
	redis.createUser("root","root",1);
}

initBdd();