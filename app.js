import "./Can.js"

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var net = require('net');
var io = require('socket.io');

// Variables reseau Can

var HOST = '192.168.173.246';
var PORT = 30000;

// Variables de connection
var authentified = false;
var numberOfConnexion = 0;
var numberOfAdmin = 0;
var socketAdmin;
var socketU;
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

var mysql = require('mysql');		// MySQL


// Communication Can
var client = new net.Socket();
client.connect(PORT, HOST, function() {
	console.log('Connected');
	client.setNoDelay();
});

client.on('data', function(data) {
	var res = data.toString('hex');
	//console.log('Received: ' + res);

	var i = res.indexOf("43");
	var j;
	while( i != -1)
	{
		//récupération de la longueur du message
		var dlc = parseInt(res.slice(i+2,i+4),16)-3;
		//calcul de la fin du message
		j = i+13+dlc*2;
		//extraction d'un message sur l'ensemble des donnée reçut
		var dataHex = res.substr(i,j+1);
		res = res.substr(j+1,res.length-(j+1));

		var size = dataHex.length;
		//récupération de l'id du message
		var id = parseInt(dataHex.slice(4,10),16);

		console.log('MSG Received: ' + dataHex);

		//récupération des donnée du message
		var msg =  dataHex.slice(10,10+dlc*2);
		console.log('DLC: ' + dlc + '   ID: '+ id +'   MSG: '+ msg);
		
		//traitement des données en fonction de l'id
		if(id == 4 )
		{
			motor = parseInt(msg.slice(0,2));
			io.emit('moteur', {for: 'everyone', moteur: motor==1?'on':'off' });
			io.emit('tenderlift', { position: motor==0?'droit':upState?'montee':'descente'});

			// temp = parseInt(msg.slice(2,4));
			// io.emit('temperature', {for: 'everyone', temperature: temp==1?'ok':'nok'});

			pres = parseInt(swapEndianness(msg.slice(2,6)),16);
			io.emit('update pression', {for: 'everyone',  pression: pres.toString() });
			
			amp = parseInt(swapEndianness(msg.slice(6,10)),16);
			//amp = parseInt(msg.slice(6,10),16);
			io.emit('update amp', {for: 'everyone', amperage: amp.toString() });

			console.log('Motor: ' + (motor==1?'ON':'OFF') + '  Pression:'+ pres + '  Intesité:' +amp);
		}
		if (id == 2)
		{
			console.log('Envoie de cmd can');
			sendCan(true,true);
			console.log(parseInt(msg,16));
			amp = swapEndianness(msg);
			console.log(amp);
		}
		//debut du prochain message
		var i = res.indexOf("43");
	}
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

	sendCan(upState,downState);
	res.send({success:true});
	io.emit()
});

//reception d'une comande pour descendre la passerelle
app.post('/descendrePasserelle', function(req, res){			// Descendre
	//upState = false;
	//downState = !downState;
	
	upState = req.body.up == "true" ? true : false ;
	downState = req.body.down == "true" ? true : false ;
	console.log('descendre Passerelle : up='+upState+ '  ,down='+downState);

	sendCan(upState,downState);
	res.send({success:true});
});

//demande d'authentification
//	USER 		|		PASSWORD 
// 	admin				admin
//	jeanJacque			jeanJacque
//	Benoit				Benoit
app.post('/authentification', function(req,res){				// Auth admin et utilisateurs tenderlift
	
	var usrName = req.body.name;
	var pwd = req.body.pwd;

	switch (usrName)
	{
		case "admin":
			if(pwd == "admin")
			{
				res.send({success:true});
				authentified = true;
				numberOfAdmin = 1;
				break;
			}
			else
			{
				res.send({success:false});
				break;
			}
			
		case "jeanJacque":
			if(pwd == "jeanJacque")
			{
				res.send({success:true});
				break;
			}
			else
			{
				res.send({success:false});
				break;
			}
		
		
		case "Benoit": 
			if(pwd == "Benoit")
			{
				res.send({success:true});
				break;
			}
			else
			{
				res.send({success:false});
				break;
			}
	}
});

//demande d'authentification entant qu'invité
app.post('/invite', function(req, res){				// invite requete
	var response = req.body.demande;
	
	if(response)
	{
		res.send({ success: true });
		
		socketAdmin.emit('newInvite', {demande:true});			// on demande a l'admin si on l'accepte
		
		console.log("emit");
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



// Quand un client se connecte
io.sockets.on('connection', function (socket) {

//remplace l'ancien admin
	if(socket.handshake.query['admin'] == "true")			// on verifie les donnée dans la requete
	{
		if(authentified)
		{
			if(numberOfAdmin > 0 && socketAdmin != null)
			{
				socketAdmin = socket;		//save admin socket
			}
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
	}
	
	socketU = socket;

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

	if(socket.handshake.query['admin'] != "true" && socket.handshake.query['admin'] != "except")	/* si c'est invite on le rajoute */
	{
		tabUser.push(name);
		tabConnexion.push(dateUser);
		tabSocket.push(socket);
		console.log("invite coucou !");
		numberOfConnexion += 1;
		
		setTimeout(timeoutConnexion, timeOutInvite, socket);		//nom function, delay, arg for function (tempo user)
	}
	
	io.emit('update pression', { pression: pres.toString() });
	io.emit('update amp', { amperage: amp.toString() });
	io.emit('moteur', {moteur: motor==1?'on':'off' });
	//io.emit('temperature', { temperature: temp==1?'ok':'nok'});
	io.emit('tenderlift', { position: motor==0?'droit':upState?'montee':'descente'});
	
});

// tempo user function
function timeoutConnexion (socket) {			
  
  if(socket != null)
  {
	  socket.emit('timeoutConnexion', {timeout:true});
  }
}


function sendCan(UP,DOWN){
	var up = (UP?1:0).toString(16);
	var down = (DOWN?1:0).toString(16);
	var prefix = 0x4305;
	var id = 10;
	var suffix = 0x460d;
	if(up == down)
		suffix = 0x470d;
	
	// compute the required buffer length
	var bufferSize = 2 + 3 + 2 + 2;
	var buffer = new Buffer(bufferSize);

	// store first byte on index 0;
	buffer.writeUInt16BE(prefix, 0);
	buffer.writeUIntBE(id, 2, 3);
	buffer.writeUIntBE(up, 5, 1);
	buffer.writeUIntBE(down, 6, 1);
	buffer.writeUIntBE(suffix, 7, 2);

	client.write(buffer,'data');
	console.log('Send    : ' + buffer.toString('hex'));
}

function swapEndianness(v)
{
	var s = v.toString(16);             // translate to hexadecimal notation
	s = s.replace(/^(.(..)*)$/, "0$1"); // add a leading zero if needed
	var a = s.match(/../g);             // split number in groups of two
	a.reverse();                        // reverse the groups
	var s2 = a.join("");                // join the groups back together
	return s2;
}

module.exports = app;