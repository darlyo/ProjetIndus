// port redis 6379
var wait=require('wait.for');
var crypto = require('crypto');
var redis = require("redis")
  , subscriber = redis.createClient()
  , subToken = redis.createClient()
	, client = redis.createClient();

	//export des functions du module
module.exports = { 
    'closeToken' : closeToken,
    'setToken' : setToken,
    'init' : init,
		'createUser' : createUser,
		'setCallbackToken' : setCallbackToken,
		'getToken' : getToken,
		'auth' : auth,
		'getDroit' : getDroit
}

var callbackToken;
function setCallbackToken(callback)
{
	callbackToken = callback;
}

//activation de la reception des evenements ur les expirations
//subscrition à différant mot clef
function init(clear = false)
{
	if (clear)	//vide la BD
		client.flushall();

	//active les notifiaction d'expiration
	client.config("set", "notify-keyspace-events", "KEx");
	//subscribe expiration token
	subToken.psubscribe("__keyspace@0__:token:*");
}

//creation d'un nouveau utilisateur
// droit  1= admin 		2= user
function createUser(name, pwd, droit = 2)
{
	var replie = wait.forMethod(client,"exists","user:"+name);
	//si l'ulitilisateur nexiste pas on le crée
	console.log("client "+name+" existe: "+replie);
	if (replie == "0" ){
		replie = wait.forMethod(client,"hmset", "user:"+name, "pwd", pwd, "droit", droit);
		console.log("Utilisateur "+name+" créé :" +replie);
	}
	else
		console.log("Utilisateur "+name+" existe déjà, creation annulé");
	return "ok";
}

function delUser(name, callback)
{
	client.del("user:"+name, redis.print);
	client.exists("user:"+name, redis.print);
}

//vérifie que la connection est possible
//Return :
//	 1 : mot de passe correct
//	 0 : mot de passe incorrect
//	-1 : utilisateur inconnue 
//  -2 : serveur redis timeout 3s
function auth2(name, pwd, callback)
{
	var res = -2;
	//var replie = wait.forMethod(client,"hget","user:"+name, "pwd");
	client.hget("user:"+name,"pwd",function(err,reply){
		if ((reply == "nil") || (reply == null))
			res = -1;
		//sinon sin mot de passe coorect
		else if (reply == pwd)
			res = 1;
		//mot de passe incorect
		else res = 0;
		console.log("reolie auth 2:"+res);
	});
	//utilisateur incorrect

	return res;
}

// authentifiaction d'un utilisateur
// exécute la fonction callback fournir
// callback(statut, res, droit, token)
function auth(name, pwd, res, callback)
{
	var statut;
	
	//var replie = wait.forMethod(client,"hget","user:"+name, "pwd");
	client.hget("user:"+name,"pwd",function(err,reply){
		//utilisateur incorrect
		if ((reply == "nil") || (reply == null))
			statut = -1;
		//sinon sin mot de passe coorect
		else if (reply == pwd){
			statut = 1;
			client.hget("user:"+name,"droit",function(err,droit)
			{
				const buf = crypto.randomBytes(20);
				
				var time = 60*5*2/droit;
				//   2 : droit  d'utilisateur			-> session de 5min
				//	 1 : droit d'administrateur		-> session de 10min
				client.setex("token:"+name,time, buf, function (err, replie) {
					console.log("setnx token:"+name+"  :"+replie);
					console.log("erreur set token: "+err);
					if (replie == "OK" ){
						//client.expire("token:"+name, time);
						client.lpush("user_co", name);
					}
					else
						statut = -2;
					callback(statut, res, droit, buf);
				});
			});
			return;
		}
		//mot de passe incorect
		else statut = 0;
		
		callback(statut, res);
		console.log("reolie auth 2:"+statut);
	});
	return;
}

//vérifie que la connection est possible
//Return :
//   2 : droit  d'utilisateur
//	 1 : droit d'administrateur
//	-1 : utilisateur inconnue 
//  -2 : serveur redis timeout 3s
function getDroit(name)
{
	var res = -2;
	var replie = wait.forMethod(client,"hget","user:"+name, "droit");
	//utilisateur incorrect
	if (replie == "nil")
		res = -1;
	//sinon renvoi le niveau de droit de l'utilisateur
	else res = replie;

	return res;
}


//creation d'un token pour identifié un ulitilisateur connecté et
// vérifié la durée de vie de la connection
function setToken(user, time, size = 20)
{
	const buf = crypto.randomBytes(size);
	//console.log(`${buf.length} bytes of random data: ${buf.toString('hex')}`);
	client.setnx("token:"+user, buf, function (err, replie) {
		console.log("setnx token:"+user+"  :"+replie);
		if (replie == "1" ){
			client.expire("token:"+user, time);
			client.lpush("user_co", user);
		}
	});
	return buf;
}

function getToken(user)
{
	var token = wait.forMethod(client,"get","token:"+user);
	return token;
}

//Demande de fermeture d'une connection
function closeToken(user, callbackToken){
	console.log("Token user: " + user +" close");
	client.del("token:"+user, redis.print);
	client.lrem("user_co", 0, user);
	
	client.lrange("user_co", 0,-1,function (err, replies) {
    console.log(replies.length + " utuilsateur connecté:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
	});
	
	//fermeture socket avec l'user
	callbackToken(user);
}

//sur reception d'un événement:
// expiration de la durée de vie d'un token
// on enléve l'utilisateur associé de la liste des utilisateur connecté
subToken.on("pmessage", function(channel, message) {
	var user = message.slice(21);
	console.log("Token user: " + user +" expired");
	client.lrem("user_co", 0, user);
	
	client.lrange("user_co", 0,-1,function (err, replies) {
    console.log(replies.length + " utuilsateur connecté:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
	});
		
	//fermeture socket avec l'user
	callbackToken(user);
});

client.on("error", function (err) {
    console.log("Error " + err);
});

