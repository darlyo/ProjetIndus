/* var redis = require("redis")
  , subscriber = redis.createClient()
  , subToken = redis.createClient()
	, client = redis.createClient(); */
var redis = require('./redis.js')

console.log("**********************************");
console.log("********** Creation BDD **********");
console.log("**********************************");
redis.createUser("paul","paul",2);
redis.createUser("admin","admin",1);

/*
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
*/

/*
function createUser(name, pwd, droit = 2)
{
	client.exists("user:"+name, function(err, replie){
		//si l'ulitilisateur nexiste pas on le crée
		console.log("client "+name+" existe: "+replie);
		if (replie == "0" ){
			client.hmset("user:"+name, "pwd", pwd, "droit", droit, function(err, replie){
				console.log("Utilisateur "+name+" créé :" +replie);
			});
		}
		else
			console.log("Utilisateur "+name+" existe déjà, creation annulé");
	});
	
	return "ok";
}
*/
