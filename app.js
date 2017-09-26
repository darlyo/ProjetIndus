//import
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var net = require('net');
const https = require('https');
const fs = require('fs');

//Mes modules
var can = require('./can.js')
var redis = require('./redis.js')

//Lance le serveur en daemon (linux uniqument)
/*
require('daemon')();
console.log(process.pid);					// nouveau pid du serveur NODE.JS
*/

// Variables reseau Can
var HOST = '192.168.173.246';
var PORT = 30000;

// Variables de connection
var socketAdmin;
var tabUser2 = [];

//Variables global
var upState = false;
var downState = false;
var motor = 0;
var temp = 1;
var pres = 0;
var amp = 0;
var id=0;

//timeout Connexion user
var timeOutInvite = 240000; 		// milliseconde

//Variables serveur
var app = express();
app.use(express.static('public'));		// dossier public pour client

//création du serveur en https
var server = .createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app).listen(3300);

var io = require('socket.io').listen(server);


//active les notification d'expiration
redis.init(false);
redis.setCallbackToken(timeoutConnexion);
redis.getToken("la");
redis.getToken("admin");
// Communication Can
var client = new net.Socket();
//tentative de connection au CR3131 toute les 2min si non connecté
var timeoutCR3131 = setTimeout(connectCR3131,120000);

function connectCR3131(){
	client.connect(PORT, HOST, function() {
		console.log('Connected');
		client.setNoDelay();
	});
}

client.on('data', function(data) {
	console.log("Reception de données");
	can.readCan(data,traitementMsg);
});

// action sur la communcation avec le cr3131
client.on('close', function() {
	console.log('Connection closed');
	if(timeoutCR3131 == null)
		timeoutCR3131 = setTimeout(connectCR3131,20000);
});
client.on('connect', function() {
	io.emit('CanOK');
	console.log('Connection etablie');
	clearInterval(timeoutCR3131);
	timeoutCR3131 = null;
});
client.on('drain', function() {
	console.log('Connection drain');
});
client.on('end', function() {
	console.log('Fin de connection');
	if(timeoutCR3131 == null)
		timeoutCR3131 = setTimeout(connectCR3131,20000);
});
client.on('error', function() {
	console.log('Connection error');
	io.emit('erreurCan');
	if(timeoutCR3131 == null)
		timeoutCR3131 = setTimeout(connectCR3131,20000);
});

server.listen(3300);

app.use(bodyParser.json());								// communication json
app.use(bodyParser.urlencoded({ extended: false }));

//----------------------Contruction des routes -------------------------------------------
//Page d'accueil
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname+'/index.html'));
});

//demande d'authentification
//	USER 		|		PASSWORD 
// 	admin				admin
//	jeanJacque			jeanJacque
//	Benoit				Benoit
app.post('/authentification', function(req,res){				// Auth admin et utilisateurs tenderlift
	
	var usrName = req.body.name;
	var pwd = req.body.pwd;

	redis.auth(usrName, pwd, res, callbackAuth);
});

var callbackAuth = function(statut, res, droit, token, name)
{
	console.log("execute le callback Auth");
	console.log("statut: "+statut+"  ; droit: "+droit+"  ;token: "+token);
	switch (statut)
	{
		case 1:
			console.log("reponse auth");
			res.send({"success":true, "token":token, "droit":droit, "name":name});
			break;
		case 0:
			res.send({"success":false, "info":"mot de passe incorrect"});
			break;
		default :
			res.send({"success":false, "info":"erreur serveur"});
	}
}

//demande d'authentification entant qu'invité
app.post('/invite', function(req, res){				// invite requete
	console.log("demande de connection invitée");
	if(socketAdmin != null)
	{
		res.send({ success: true });
		
		// on demande a l'admin si on l'accepte
		socketAdmin.emit('newInvite');			
	}
	else {
		res.send({success:false});
	}
});

// disconnect client = delete socket and user
app.post('/decoUser', function(req,res){			
	
	var user = req.body.name;
	
	console.log("deco :"+user +" (by admin)");
	redis.closeToken(user);
	
	//renvoie le  tableau des utilisateurs mit à jour
	var users =[];
	var conexion =[];
	tabUser2.forEach(function (a){
		users.push(a.name);
		conexion.push(a.date);		
		});
	res.send({'users':users, 'dateConnexion':conexion});
	console.log('users: ' +users);
	console.log('conexion: ' +conexion);
});

// renvoi le tableau des utilisateurs
app.get('/users', function(req,res){
	var users =[];
	var conexion =[];

	tabUser2.forEach(function (a){
		users.push(a.name);
		conexion.push(a.date);		
		});
	res.send({'users':users, 'dateConnexion':conexion});
	console.log('users: ' +users);
	console.log('conexion: ' +conexion);
});


// Quand un client se connecte on l'ajoute à la liste des utilsateur connecté et on enregristre la date de connection
// Pour un invité on demande à l'admin de valide la connection, sinon la connection est refusé
//io.sockets.on('connection', function (socket) {
io.on('connection', function (socket) {
	
	var now = new Date();
	var annee   = now.getFullYear();
	var mois    = now.getMonth() + 1;
	var jour    = now.getDate();
	var heure   = now.getHours();
	var minute  = now.getMinutes();
	
	var dateUser = jour + '/' + mois + '/' + annee + ':' + heure + ':' + minute;
	var name;
	
	//Si c'est un invité
	if(socket.handshake.query['invite'] == "true" )	/* si c'est invite on le rajoute */
	{
		//si on a un admin connecté envoie de la demande de connection à celui-ci
		if(socketAdmin != null)
		{
			console.log("connection invité");	
			
			//si validation de l'admin, on accepte la connexion de l'invité
			socketAdmin.once('inviteOk', function (data) {		
				console.log("envoi invite to admin ok");
				var token;
				
				//Définit un nom unique pour l'invité
				name = "Invite1";			// name User
				var r = tabUser2.find(function(a){return a.name === name});
				var i= 1;
				while(r != null)
				{
					i++;
					name = "Invite" + i;
					r = tabUser2.find(function(a){return a.name === name});
				}
				
				redis.setToken(name, valideInvite, socket);
						
				var objectU = {'name':name, 'date':dateUser, 'socket':socket, 'droit':2}; //'timeout':timeOut};
				tabUser2.push(objectU);
			});
			socketAdmin.on('inviteNon', function (data) {
				socket.emit('inviteOkUser', {demande:false});		//  demande de connection en invité refué
			});				

		}
		else
			socket.emit('inviteOkUser', {demande:false});		//  demande de connection en invité refué

		console.log("invite coucou !");
		// setTimeout(timeoutConnexion, timeOutInvite, socket);		//nom function, delay, arg for function (tempo user)
	}
	else
	{
		name = socket.handshake.query['name'];			// name User
		droit = socket.handshake.query['droit'];
		console.log("connection user: " + name);
		var r = tabUser2.findIndex(function(a){return a.name === name});
		if(r == -1)	//utilisateur non connecté
		{
			var objectU = {'name':name, 'date':dateUser, 'socket':socket, 'droit':droit}; //'timeout':timeOut};
			tabUser2.push(objectU);
		}
		else
		{
			tabUser2[r].date = dateUser;
			tabUser2[r].socket = socket;
			tabUser2[r].droit = droit;
		}
	}
	
	//envoie des données CAN
	updateData();
	
	//Operation sur recetion de message socket
	socket.on('cmd_up', function (msg) {
		console.log("cmd up passerelle");
		redis.checkToken(msg.name, msg.token, TDL_UP);
		//TDL_UP();
	});
	
	socket.on('cmd_down', function (msg) {
		console.log("cmd down passerelle");
		redis.checkToken(msg.name, msg.token, TDL_DOWN);
		//TDL_DOWN();
	});
	
	socket.on('cmd_stop', function (msg) {
		console.log("cmd stop passerelle");
		redis.checkToken(msg.name, msg.token, TDL_STOP);
		//TDL_STOP();
	});
	
	socket.on('isAdmin', function (msg) {
		console.log("définit le nouveau admin en charge");
		redis.checkToken(msg.name, msg.token, setAdmin, socket);
	});

});

function setAdmin(socket)
{
	console.log("new admin set");
	if(socketAdmin != null)
			socketAdmin = socket;		//save admin socket

	//enregistrement de l'utilisateur en tant qu'admin
	else
	{
		socketAdmin = socket;
		socketAdmin.on('disconnect', function () 
		{
			console.log("disconnect admin");
			socketAdmin = null;
		});
	}
}

function valideInvite(statut, socket, token, user)
{
	//  si token créé, on le notifie au client que la connection est accepté
	if (statut ==1)
		socket.emit('inviteOkUser', {'demande':true, 'token':token, 'name':user});		
	else{
		socket.emit('inviteOkUser', {'demande':false});		
		console.log("erreur création token invité: "+user);
		
		var id = tabUser2.findIndex(function(a){return a.name === user});
		if(id != -1){
			tabUser2.splice(id,1);		//on suprime l'élément du tableau		
		}
	}
		
}

// tempo user function
function timeoutConnexion(user) 
{
	var id = tabUser2.findIndex(function(a){return a.name === user});
	if(id != -1){
		console.log("user: "+user+" deco");
		if(tabUser2[id].socket != null){
			tabUser2[id].socket.emit('timeoutConnexion', {timeout:true});
		}
		tabUser2.splice(id,1);		//on suprime l'élément du tableau
	}
	else
		console.log("user: "+user+" non enregristré");
	
}

//Envoie les commande de controle du tenderlift
//Parametre :
//	- up 		: boolean
//	- down 	: boolean
function sendCMD(up,down)
{
	var data =[];
	data[0] = {type: 'bool', value:up};
	data[1] = {type: 'bool', value:down};
	var msg = Buffer.from(can.buildMsg(10,data));
	console.log('Send    : ' + msg.toString('hex'));
	client.write(msg,'data');
}

function TDL_UP(){
	upState = true;
	downState = false;
	sendCMD(true,false);
}
function TDL_DOWN(){
	upState = false;
	downState = true;
	sendCMD(false,true);
}
function TDL_STOP(){
	upState = false;
	downState = false;
	sendCMD(false,false);
}

//mise a jour des donnée coté client via socket.io
function updateData(){
	io.emit('update pression', { pression: pres.toString() });
	io.emit('update amp', { amperage: amp.toString() });
	io.emit('moteur', {moteur: motor==1?'on':'off' });
	//io.emit('temperature', { temperature: temp==1?'ok':'nok'});
	io.emit('tenderlift', { position: motor==0?'droit':upState?'montee':'descente'});
}

//traitement des messages CAN reçut
var traitementMsg = function(msg,id)
{
	switch (id){
		case 4:
		{
			motor = parseInt(msg.slice(0,2));
			io.emit('moteur', {for: 'everyone', moteur: motor==1?'on':'off' });
			upState = parseInt(msg.slice(2,4));
			downState = parseInt(msg.slice(4,6));
			io.emit('tenderlift', { position: motor==0?'droit':upState?'montee':'descente'});

			// temp = parseInt(msg.slice(2,4));
			// io.emit('temperature', {for: 'everyone', temperature: temp==1?'ok':'nok'});

			pres = parseInt(can.swapEndianness(msg.slice(6,10)),16);
			io.emit('update pression', {for: 'everyone',  pression: pres.toString() });
			
			amp = parseInt(can.swapEndianness(msg.slice(10,14)),16);
			io.emit('update amp', {for: 'everyone', amperage: amp.toString() });

			console.log('Motor: ' + (motor==1?'ON':'OFF') + '  Pression:'+ pres + '  Intesité:' +amp);
			break;
		}
		default :
		{
			console.log("id du message: "+id+" n'est pas traité.");
		}
	}
};

