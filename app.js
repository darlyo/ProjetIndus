var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var net = require('net');

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
	var i = res.indexOf("4307");
	var dataHex = res.substr(i,22);
	//console.log('Received: ' + dataHex);
	while( res.length >= 22)
	{
		res = res.substr(i+23,res.length-i-23);
		var size = dataHex.length;
		var id = parseInt(dataHex.slice(4,10));

		if(( size == 22) && (id == 4 ))
		{
			var dlc = parseInt(dataHex.slice(2,4))-3;
			var msg =  dataHex.slice(10,10+dlc*2);
			//console.log('DLC: ' + dlc + '   ID: '+ id +'   MSG: '+ msg);

				motor = parseInt(msg.slice(0,2));
				io.emit('moteur', {for: 'everyone', moteur: motor==1?'on':'off' });
				io.emit('tenderlift', { position: motor==0?'droit':upState?'montee':'descente'});

				temp = parseInt(msg.slice(2,4));
				io.emit('temperature', {for: 'everyone', temperature: temp==1?'ok':'nok'});

				pres = swapEndianness(parseInt(msg.slice(4,12),16));
				io.emit('update pression', {for: 'everyone',  pression: pres.toString() });

			//console.log('Motor: ' + (motor==1?'ON':'OFF') + '   Temp: '+(temp==1?'ON':'OFF') + '  Pression:'+ pres);
		}
	}
});

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


// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());								// communication json
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());

//app.use('/', index);
//app.use('/users', users);
//app.use('/images', img)

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname+'/index.html'));
});

app.post('/monterPasserelle', function(req, res){					// Monter passerelle
	//upState = !upState;
	//downState = false;
	upState = req.body.up == "true" ? true : false ;
	downState = req.body.down == "true" ? true : false ;
	
	sendCan(upState,downState);
	res.send({success:true});
	io.emit()
});

app.post('/descendrePasserelle', function(req, res){			// Descendre
	//upState = false;
	//downState = !downState;
	
	upState = req.body.up == "true" ? true : false ;
	downState = req.body.down == "true" ? true : false ;

	sendCan(upState,downState);
	res.send({success:true});
});


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


app.post('/invite', function(req, res){				// invite requete
	var response = req.body.demande;
	
	if(response)
	{
		res.send({ success: true });
		socketAdmin.emit('newInvite', {demande:true});			// on demande a l'admin si on l'accepte
		socketU.emit('newInvite', {demande:true});
		
		console.log("emit");
		
		socketAdmin.on('inviteOk', function (data) {		// si admin ok
			console.log("envoi invite to admin ok");
			io.emit('inviteOk', {demande:true});		//  on le notifie au client
		});
		
		socketU.on('inviteOk', function (data) {
			console.log("envoi invite ok");
			io.emit('inviteOk', {demande:true});
		});
	}
	else {
		//res.send({success:false});
	}
	
});


app.post('/decoUser', function(req,res){			// disconnect client = delete socket and user
	
	var idUser = req.body.id;
	

	console.log(idUser);
	
	var socketU = tabSocket[idUser];
	
	delete socketU;
	delete tabUser[idUser];
	delete tabConnexion[idUser];
});

app.post('/deleteLastUser', function(req,res){		// quand l'admin n'accepte pas le client on le suppr car il à été rentré
	delete tabUser[tabUser.length-1];
	delete tabConnexion[tabConnexion.lenght-1];
	delete tabSocket[tabConnexion.lenght-1];
});


app.get('/users', function(req,res){				// renvoi le tableau des invites suite au get
	var tabUserBis = [];
	var tabDateBis = [];
	
	for(var i = 0; i <tabUser.length; i++)
	{
		if(tabUser[i] != null)
		{
			tabUserBis.push(tabUser[i]);
			tabDateBis.push(tabConnexion[i]);
		}
	}
	
	res.send({users:tabUserBis, dateConnexion:tabDateBis});
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
		socketAdmin.emit('newConnexion', {inviteName:name, dateConnexion:dateUser} );		// notification d'une connexion à l'admin
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
	io.emit('moteur', {moteur: motor==1?'on':'off' });
	io.emit('temperature', { temperature: temp==1?'ok':'nok'});
	io.emit('tenderlift', { position: motor==0?'droit':upState?'montee':'descente'});
	
	
	/*var mySqlClient = mysql.createConnection({				// Connexion mysql
		host     : "localhost",
		user     : "root",
		password : "mysql",
		database : "test"
	});*/
	
	/*var selectQuery = 'SELECT * FROM Users';
 
	mySqlClient.query(
	  selectQuery,
	  function select(error, results, fields) {
		if (error) {
		  console.log(error);
		  mySqlClient.end();
		  return;
		}
	 
		if ( results.length > 0 )  { 
		  var firstResult = results[ 0 ];
		  console.log('idUsers: ' + firstResult['idUsers']);
		  console.log('userName: ' + firstResult['userName']);
		  console.log('userPwd: ' + firstResult['userPwd']);
		} else {
		  console.log("Pas de données");
		}
		mySqlClient.end();
	  }
	);*/
	
});

function timeoutConnexion (socket) {			// tempo user function
  
  if(socket != null)
  {
	  socket.emit('timeoutConnexion', {timeout:true});
  }
}


function sendCan(UP,DOWN){
	var up = (UP?1:0).toString(16);
	var down = (DOWN?1:0).toString(16);
	var prefix = 0x4305;
	var id = 1;
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
	var v2 = parseInt(s2, 16);          // convert to a number
	return v2;
}


// catch 404 and forward to error handler
/*app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
var FS = require('q-io/fs');
var HTTP = require('q-io/http');

FS.makeTree('/tmp/foo/bar/baz').then(function() {
  console.log('Path created!');
});

HTTP.read('http://www.myapifilms.com/imdb?name=Julianne+Moore&filmography=1')
.then(function(data) {
  var movies = _.findWhere(data.filmographies, { section: 'Actress' });
  movies = _.map(movies, function(m) {
    return m.title + ' (' + m.year + ')';
  });
  console.log(movies);
});*/

module.exports = app;
