// port redis 6379
var util = require('util');
var crypto = require('crypto');
var redis = require("redis")
  , subscriber = redis.createClient()
  , subToken = redis.createClient()
	, client = redis.createClient();
	
	
	//export des functions du module
module.exports = { 		
		'setCallbackToken' : setCallbackToken,
    'init' : init,
		'createUser' : createUser,
		'delUser' : delUser,
		'auth' : auth,
		'getDroit' : getDroit,
    'setToken' : setToken,
    'getToken' : getToken,
		'checkToken' : checkToken,
    'closeToken' : closeToken
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
function createUser(name, pwd, droit = 2, callback)
{
	client.exists("user:"+name, function(err, existe){
		console.log("client "+name+" existe: "+existe);
		//si l'ulitilisateur nexiste pas on le crée

		if (existe == "0" ){
			client.hmset("user:"+name, "pwd", pwd, "droit", droit);
			console.log("Utilisateur "+name+" créé");
			if(callback != null) callback(true);
		}
		else{
			console.log("Utilisateur "+name+" existe déjà, creation annulé");
			if(callback != null) callback(false);
		}
	});
}

function delUser(name, callback)
{
	client.del("user:"+name, redis.print);
	client.exists("user:"+name, redis.print);
}

// authentifiaction d'un utilisateur
// exécute la fonction callback fournir
// callback(statut, res, droit, token)
//Return :
//	 1 : mot de passe correct
//	 0 : mot de passe incorrect
//	-1 : utilisateur inconnue 
//  -2 : serveur redis timeout 3s
function auth(name, pwd, res, callback)
{
	var statut;
	console.log("identifiaction redis "+name+"  pwd: "+pwd);
	client.hget("user:"+name,"pwd",function(err,reply){
		//utilisateur incorrect
		if ((reply == "nil") || (reply == null))
			statut = -1;
		//mot de passe correct
		else if (reply == pwd){
			statut = 1;
			client.hget("user:"+name,"droit", function(err,droit)
			{
				const buf = randomAsciiString(20);

				var time = 60*5*2/droit;
				//   2 : droit  d'utilisateur			-> session de 5min
				//	 1 : droit d'administrateur		-> session de 10min
				client.setnx("token:"+name, buf, function (err, replie) 
				{
					console.log("setnx token:"+name+"  :"+replie);
					console.log("setnx token: "+buf);
					if(err != null)
						console.log("erreur set token: "+err);
					//definit l'expiration et ajout l'utilisateur à la liste des connectés
					else if (replie == "1" ){
						client.expire("token:"+name, time);
						client.lpush("user_co", name);
					}
					//token déjà existant -> changement du token et reset expiration
					else if (replie == "0" ){
						client.set("token:"+name, buf);
						client.expire("token:"+name, time);
					}
					else
						statut = -2;
					callback(statut, res, droit, buf, name);
				});
			});
			return;
		}
		//mot de passe incorect
		else statut = 0;
		
		callback(statut, res,0,0);
	});
}

//vérifie que la connection est possible
//Return :
//   2 : droit  d'utilisateur
//	 1 : droit d'administrateur
//	-1 : utilisateur inconnue 
//  -2 : serveur redis timeout 3s
function getDroit(name, callback)
{
	client.hget("user:"+name, "droit",function (err, replie) {
		var res = -2;
		
		//utilisateur incorrect
		if (replie == "nil")
			res = -1;
		//sinon renvoi le niveau de droit de l'utilisateur
		else res = replie;
		
		if (callback != null)
			callback(res);
	});
}

//creation d'un token pour identifié un ulitilisateur connecté et
// vérifié la durée de vie de la connection
// default: session de 5min
function setToken(name, callback, socket, time=300, size = 20)
{
	const buf = randomAsciiString(size);
	var statut = -1;

	client.setnx("token:"+name, buf, function (err, replie) {
		console.log("setnx token:"+name+"  :"+replie);
		console.log("setnx token: "+buf);
		if(err != null)
			console.log("erreur set token: "+err);
		else{
			//definit l'expiration et ajout l'utilisateur à la liste des connectés
			if (replie == "1" ){
			statut = 1;
			client.expire("token:"+name, time);
			client.lpush("user_co", name);
			}
			//token déjà existant -> changement du token et reset expiration
			else if (replie == "0" ){
				statut = 1;
				client.set("token:"+name, buf);
				client.expire("token:"+name, time);
			}
			else
				statut = -2;
		}
		callback(statut, socket, buf, name);
	});
}

function getToken(user, callback)
{
	client.get("token:"+user, function (err, token) {
		if(err != null)
			console.log("erreur get token: "+err);
		else if(token == null)
			console.log("get token:"+user+" inconnu");
		else
			console.log("get token:"+user+" = "+token);
	});
}

function checkToken(user, token, callback, socket =null)
{
	client.get("token:"+user, function (err, replie) {
		console.log("get token:"+user+"  :"+replie + " = " +token);
		if ((replie == token) && (token != null))
			if (socket != null) callback(socket);
			else callback();
		else
			callbackToken(user);	//deconnection de l'user
	});
}

//Demande de fermeture d'une connection
function closeToken(user, callbackT = callbackToken)
{
	console.log("Token user: " + user +" close");
	client.del("token:"+user, redis.print);
	client.lrem("user_co", 0, user);
	
	client.lrange("user_co", 0,-1,function (err, replies) {
    console.log(replies.length + " utilisateur connecté:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
	});
	
	//fermeture socket avec l'user
	callbackT(user);
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

function randomString(length, chars) {
  if (!chars) {
    throw new Error('Argument \'chars\' is undefined');
  }

  var charsLength = chars.length;
  if (charsLength > 256) {
    throw new Error('Argument \'chars\' should not have more than 256 characters'
      + ', otherwise unpredictability will be broken');
  }

  var randomBytes = crypto.randomBytes(length);
  var result = new Array(length);

  var cursor = 0;
  for (var i = 0; i < length; i++) {
    cursor += randomBytes[i];
    result[i] = chars[cursor % charsLength];
  }
  return result.join('');
}

function randomAsciiString(length) {
  return randomString(length,
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
}
