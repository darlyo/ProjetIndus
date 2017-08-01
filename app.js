//import
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var net = require('net');
var io = require('socket.io');
var wait=require('wait.for');

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
var authentified = false;
var numberOfConnexion = 0;
var numberOfAdmin = 0;
var socketAdmin;
var tabUser = [];
var tabConnexion = [];
var tabSocket = [];

//Variables global
var upState = false;
var downState = false;
var motor = 0;
var temp = 1;
var pres = 0;
var amp = 0;

//timeout Connexion user
var timeOutInvite = 240000; 		// milliseconde

//Variables serveur
var app = express();
app.use(express.static('public'));		// dossier public pour client
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

//active les notification d'expiration
redis.init(false);
redis.setCallbackToken(function(user){console.log("user: "+user+" deco");});

// Communication Can
var client = new net.Socket();
client.connect(PORT, HOST, function() {
	console.log('Connected');
	client.setNoDelay();
});

client.on('data', function(data) {
	readCan(data,traitementMsg);
});

// action sur la communcation avec le cr3131
client.on('close', function() {
	console.log('Connection closed');
});
client.on('connect', function() {
	console.log('Connection etablie');
});
client.on('drain', function() {
	console.log('Connection drain');
});
client.on('error', function() {
	console.log('Connection error');
});

server.listen(3300);

app.use(bodyParser.json());								// communication json
app.use(bodyParser.urlencoded({ extended: false }));

//----------------------Contruction des routes -------------------------------------------
//Page d'accueil
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname+'/index.html'));
});

//reception d'une comande pour monter la passerelle
app.post('/monterPasserelle', function(req, res){					// Monter passerelle
	//upState = !upState;
	//downState = false;
	upState = req.body.up == "true" ? true : false ;
	downState = req.body.down == "true" ? true : false ;
	console.log('monter Passerelle : up='+upState+ '  ,down='+downState);

	sendCMD(upState,downState);
	res.send({success:true});
});

//reception d'une comande pour descendre la passerelle
app.post('/descendrePasserelle', function(req, res){			// Descendre
	//upState = false;
	//downState = !downState;
	if (req.body.token = wait.launchFiber(redis.getToken))
	{	
		upState = req.body.up == "true" ? true : false ;
		downState = req.body.down == "true" ? true : false ;
		console.log('descendre Passerelle : up='+upState+ '  ,down='+downState);

		sendCMD(upState,downState);
		res.send({success:true});
	}
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

var callbackAuth = function(statut, res, droit, token)
{
	console.log("execute le callback Auth");
	console.log("statut: "+statut+"  ; droit: "+droit+"  ;token: "+token);
	switch (statut)
	{
		case 1:
			res.send({"success":true, "token":token, "droit":droit});
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
	var response = req.body.demande;
	console.log("demande de connection invitée");
	if(response)
	{
		res.send({ success: true });
		
		socketAdmin.emit('newInvite', {demande:true});			// on demande a l'admin si on l'accepte
		updateData();
		}
	else {
		//res.send({success:false});
	}
	
});

// disconnect client = delete socket and user
app.post('/decoUser', function(req,res){			
	
	var idUser = req.body.id;
	
	console.log(idUser);
	
	var socketU = tabSocket[idUser];
	
	delete socketU;
	delete tabUser[idUser];
	delete tabConnexion[idUser];
});

// quand l'admin n'accepte pas le client on le suppr car il à été rentré
app.post('/deleteLastUser', function(req,res){		
	delete tabUser[tabUser.length-1];
	delete tabConnexion[tabConnexion.lenght-1];
	delete tabSocket[tabConnexion.lenght-1];
});

// renvoi le tableau des invites suite au get
app.get('/users', function(req,res){				
	res.send({users:tabUser, dateConnexion:tabConnexion});
});


// Quand un client se connecte on l'ajoute à la liste des utilsateur connecté et on enregristre la date de connection
// Pour un invité on demande à l'admin de valide la connection, sinon la connection est refusé
io.sockets.on('connection', function (socket) {

//remplace l'ancien admin
	if(socket.handshake.query['admin'] == "true")			// on verifie les donnée dans la requete
	{
		//remplacement de l'admin actuel
		if(numberOfAdmin > 0 && socketAdmin != null)
		{
			socketAdmin = socket;		//save admin socket
		}
		//enregistrement de l'utilisateur en tant qu'admin
		else
		{
			socketAdmin = socket;
			socketAdmin.on('disconnect', function () 
			{
				console.log("disconnect admin");
				numberOfAdmin = 0;				// deco admin
			});
		}
	}
	
  console.log('Un client est connecté !');
	var now = new Date();
	var annee   = now.getFullYear();
	var mois    = now.getMonth() + 1;
	var jour    = now.getDate();
	var heure   = now.getHours();
	var minute  = now.getMinutes();
		
	var dateUser = jour + '/' + mois + '/' + annee + ':' + heure + ':' + minute;
	
	var name = "User" + numberOfConnexion;			// name User
	
	if(socketAdmin != null)
	{
		socketAdmin.on('inviteOk', function (data) {		// si admin ok
			console.log("envoi invite to admin ok");
			io.emit('inviteOkUser', {demande:true});		//  on le notifie au client
		});
	}
	else
		io.emit('inviteOkUser', {demande:false});		//  demande de connection en invité refué

	if(socket.handshake.query['admin'] != "true" && socket.handshake.query['admin'] != "except")	/* si c'est invite on le rajoute */
	{
		tabUser.push(name);
		tabConnexion.push(dateUser);
		tabSocket.push(socket);
		console.log("invite coucou !");
		numberOfConnexion += 1;
		
		setTimeout(timeoutConnexion, timeOutInvite, socket);		//nom function, delay, arg for function (tempo user)
	}
	updateData();
	
});

io.sockets.on('cmd', function (socket) {
	console.log("cmd via socket reçut");
});

// tempo user function
function timeoutConnexion (socket) {			
  
  if(socket != null)
  {
	  socket.emit('timeoutConnexion', {timeout:true});
  }
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
var traitementMsg = function(msg)
{
	switch (id){
		case 4:
		{
			motor = parseInt(msg.slice(0,2));
			io.emit('moteur', {for: 'everyone', moteur: motor==1?'on':'off' });
			io.emit('tenderlift', { position: motor==0?'droit':upState?'montee':'descente'});

			// temp = parseInt(msg.slice(2,4));
			// io.emit('temperature', {for: 'everyone', temperature: temp==1?'ok':'nok'});

			pres = parseInt(can.swapEndianness(msg.slice(2,6)),16);
			io.emit('update pression', {for: 'everyone',  pression: pres.toString() });
			
			amp = parseInt(can.swapEndianness(msg.slice(6,10)),16);
			io.emit('update amp', {for: 'everyone', amperage: amp.toString() });

			console.log('Motor: ' + (motor==1?'ON':'OFF') + '  Pression:'+ pres + '  Intesité:' +amp);
			break;
		}
		case 2:
		{
			console.log('Envoie de cmd can');
			sendCMD(true,true);
			console.log(parseInt(msg,16));
			amp = can.swapEndianness(msg);
			console.log(amp);
		}
		default :
		{
			console.log("id du message: "+id+" n'est pas traité.");
		}
	}
};

