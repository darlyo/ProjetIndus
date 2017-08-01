/* var redis = require("redis")
  , subscriber = redis.createClient()
  , subToken = redis.createClient()
	, client = redis.createClient(); */
var redis = require('./redis.js')
var wait=require('wait.for');


	
wait.launchFiber(redis.init,"true");
console.log("create user: paul");
var r = wait.launchFiber(redis.createUser,"paul","azaz",1);
var r = wait.launchFiber(redis.createUser,"admin","admin",1);
console.log("fin  "+r);

function createUser(name, pwd, droit = 2)
{
	var replie = wait.forMethod(client,"exists","user:"+name);
	//si l'ulitilisateur nexiste pas on le crée
	console.log("client "+name+" existe: "+replie);
	if (replie == "0" ){
		replie = wait.forMethod(client,"hmset", "user:"+name, "pwd", pwd, "droit", droit);
		//client.wait(1,3000);
		console.log("Utilisateur "+name+" créé :" +replie);
	}
	else
		console.log("Utilisateur "+name+" existe déjà, creation annulé");
	return "ok";
}