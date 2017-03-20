var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
//var logger = require('morgan');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


//var index = require('./routes/index');
//var users = require('./routes/users');
//var img = require('./public/images');

var authentified = false;
var numberOfConnexion = 0;
var socketAdmin;
var tabUser = [];
var tabConnexion = [];
var tabSocket = [];

var app = express();
app.use(express.static('public'));
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var mysql = require('mysql');		// MySQL

server.listen(3300);


// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());

//app.use('/', index);
//app.use('/users', users);
//app.use('/images', img)

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname+'/index.html'));
});

app.post('/monterPasserelle', function(req, res){
	var upState = req.body.up;
	var downState = req.body.down;
	
	if(upState)
	{
		res.send({success:true});
		//Envoi to PCL
	}
});

app.post('/descendrePasserelle', function(req, res){
	var upState = req.body.up;
	var downState = req.body.down;
	
	if(downState)
	{
		res.send({success:true});
		//Envoi to PCL
	}
});

app.post('/authentification', function(req,res){
	
	var usrName = req.body.name;
	var pwd = req.body.pwd;
	
	if(usrName == "admin" && pwd == "admin")
	{
		res.send({success:true});
		authentified = true;
	}
	else
	{
		res.send({success:false});
		authentified = false;
	}
	
	
});


app.post('/invite', function(req,res){
	var response = req.body.demande;
	
	if(response)
	{
		socketAdmin.emit('newInvite', {demande:true});
		
		console.log("emit");
		
		socketAdmin.on("inviteOk", function (data) {
			res.send({success:true});
		});
	}
	else{
		//res.send({success:false});
	}
	
});


app.post('/decoUser', function(req,res){
	
	var idUser = req.body.id;
	

	console.log(idUser);
	
	var socketU = tabSocket[idUser];
	
	delete socketU;
	delete tabUser[idUser];
	delete tabConnexion[idUser];
});

app.get('/users', function(req,res){
	var tabUserBis = [];
	var tabDateBis = [];
	
	for(var i = 0 ;i <tabUser.length; i++)
	{
		if(tabUser[i] != null)
		{
			tabUserBis.push(tabUser[i]);
			tabDateBis.push(tabConnexion[i]);
		}
	}
	
	res.send({users:tabUserBis, dateConnexion:tabDateBis});
});



// Quand un client se connecte, on le note dans la console

io.sockets.on('connection', function (socket) {
	
	if(numberOfConnexion == 0)
	{
		socketAdmin = socket;
	}

    console.log('Un client est connecté !');
	numberOfConnexion += 1;
	var now = new Date();
	var annee   = now.getFullYear();
	var mois    = now.getMonth() + 1;
	var jour    = now.getDate();
	var heure   = now.getHours();
	var minute  = now.getMinutes();
	
	var dateUser = jour + '/' + mois + '/' + annee + ':' + heure + ':' + minute;
	
	socket.emit('message', { content: 'Vous êtes connecté !' });
	socket.emit('update pression', { pression: '206' });
	socket.emit('moteur', {moteur:'off' });
	socket.emit('temperature', { temperature: 'ok'});
	
	var name = "User" + numberOfConnexion;
	
	socketAdmin.emit('newConnexion', {inviteName:name, dateConnexion:dateUser} );
	
	tabUser.push(name);
	tabConnexion.push(dateUser);
	tabSocket.push(socket);
	
	/*var mySqlClient = mysql.createConnection({
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
