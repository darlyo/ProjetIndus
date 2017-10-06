

	var socket;
	var socketAdmin;
	var isPc = false;
	var isPortable = false;
	var tailleDivAdmin = 55;			// modif taille div userArray on new invite
	var droit =0;
	
	var newURL = window.location.protocol + "//" + window.location.host;
	var controleButtonPressed = false;

	var etatTDL = "droit";
	var g1, g2;
		
	//----- Changement d'onglet en administrateur
	$("#contentAdmin").hide();
	
	$('#home').on('click', function() 		
	{
		if(droit == 1)
		{
			$("#contentAdmin").hide();
			$("#contentHome").show();
		}
	});
	
	$('#admin').on('click', function() 	
	{
		if(droit == 1)
		{
			$("#contentAdmin").show();
			$("#contentHome").hide();
		}
	});
	
	refreshTabInvit();						//  refresh au cas ou si on actualise la page on affiche
	
//--------------------------------------------------------------------------
//------------------------------- Gauge ------------------------------------
//--------------------------------------------------------------------------

	document.addEventListener("DOMContentLoaded", function(event) {

    g1 = new JustGage({
            id: "g1",
            value: 0,
            min: 0,
            max: 160,
			title: "Pression",
            label: "bar",
            relativeGaugeSize: true,
            donut: false,
			titleMinFontSize : 30,
			labelMinFontSize : 16,
			minLabelMinFontSize : 16,
			maxLabelMinFontSize : 16,
			labelFontColor : "#000000",
			titleFontColor : "#000000"
        });
		
		g2 = new JustGage({
            id: "g2",
            value: 0,
            min: 0,
            max: 10,
			title: "Intensité",
            label: "A",
            relativeGaugeSize: true,
            donut: false,
			titleMinFontSize : 30,
			labelMinFontSize : 16,
			minLabelMinFontSize : 16,
			maxLabelMinFontSize : 16,
			labelFontColor : "#000000",
			titleFontColor : "#000000"
        });
	});
	
//--------------------------- Check media ------------------------------------
//-----------------------Bouton Contole Mobile ou ordi------------------------
//----------------------------------------------------------------------------

	if (window.Touch) {					
        isPc = false;									// si portable on cree un bouton de sécurité 'homme mort'
		isPortable = true;
		$('#controle').append("<button type=\"button\" class=\"btn btn-primary\" id=\"controleButton\" disabled=\"\">Contrôle</button>");	
		
		controlMouvement = document.getElementById('controleButton');
		
		controlMouvement.addEventListener('touchstart', function(e){				// listener pour activer la sécurité homme mort
				controleButtonPressed =true;
			})
		//si le bouton est relaché on arrete les mouvement TDL
		controlMouvement.addEventListener('touchend', function(e){
				controleButtonPressed =false;
				$('#flecheHaut').attr('class','btn btn-primary');								<!-- Changer couleur bouton on peut aussi avec le css ou attr de la balise -->
				$.post(newURL+"/monterPasserelle", {up:false,down:false} ,callbackPost); 			<!-- post json puis callbackPost -->
				$('#flecheBas').attr('class','btn btn-primary');		
				//$.post(newURL+"/descendrePasserelle", {up:false,down:false} ,callbackPost); 
			})
			
		controlMouvement.addEventListener('touchleave', function(e){
				controleButtonPressed =false;
				$('#flecheHaut').attr('class','btn btn-primary');		
				$.post(newURL+"/monterPasserelle", {up:false,down:false} ,callbackPost);
				$('#flecheBas').attr('class','btn btn-primary');		
				//$.post(newURL+"/descendrePasserelle", {up:false,down:false} ,callbackPost);
			})
			
		controlMouvement.addEventListener('touchcancel', function(e){
				controleButtonPressed =false;
				$('#flecheHaut').attr('class','btn btn-primary');		
				$.post(newURL+"/monterPasserelle", {up:false,down:false} ,callbackPost); 
				$('#flecheBas').attr('class','btn btn-primary');
				//$.post(newURL+"/descendrePasserelle", {up:false,down:false} ,callbackPost);
			})
	}
	else
	{											// Si c'est un pc on met une checkbox pour la securite homme mort
		isPc = true;
		isPortable = false;
		$('#controle').append("<label><input type=\"checkbox\" value=\"\" id=\"controleCheck\" >Contrôle</label>");
	}

//---------------------------------------------------------------------------------
//------------------------------------ Fonction diverses --------------------------
//---------------------------------------------------------------------------------

	document.getElementById('flecheHaut').oncontextmenu = false;			// desactive menu contextuel lors d'appui long
	document.getElementById('flecheBas').oncontextmenu = false;
	
	function degriserBoutons() 
	{
		document.getElementById('flecheHaut').disabled = '';
		document.getElementById('flecheBas').disabled = '';
		document.getElementById('disconnectButton').disabled = '';
		document.getElementById('authButton').disabled = 'disabled';
		document.getElementById('inviteButton').disabled = 'disabled';
	}
	
	function griserBoutons()
	{
		document.getElementById('flecheHaut').disabled = 'disabled';
		document.getElementById('flecheBas').disabled = 'disabled';
		document.getElementById('disconnectButton').disabled = 'disabled';
		document.getElementById('authButton').disabled = '';
		document.getElementById('inviteButton').disabled = '';
	}
	
	//inutile
	function callbackPost(data, status)						// callbackPost commun après chaque post
	{
		console.log(status);
		console.log(data.success);
		if(status == "success")
		{
			if(data.success)
			{
				console.log("success post Haut");
			}
			else
			{
				console.log("fail post Haut");
			}
		}
	}

//------------------------------------------------------------------------------------------------
//----------------------------Mise à jour des données---------------------------------------------
//------------------------------------------------------------------------------------------------

	function connexionDataSocket(socket) 			<!------ Fonction de com par socket -------------------------------->
	{
		
		socket.on('message', function(message) {							<!-- Msg connexion -->
			//alert('Le serveur a un message pour vous : ' + message.content);
			console.log(message.content);
		});
					
		socket.on('update pression', function(message) {				<!-- Update pression via socket -->
			//alert('pression : ' + message.pression);
			console.log(message.pression);
			g1.refresh(message.pression);
		});
			
		socket.on('update amp', function(message) {				<!-- Update amperage via socket -->
			console.log(message.amperage);
			g2.refresh(message.amperage);
		});
		
		socket.on('moteur', function(message) {				<!-- Update moteur via socket -->
			//alert('moteur : ' + message.moteur);
			console.log(message.moteur);
			if(message.moteur == "on")
			{
				$('#ledMoteur').attr('src','images/ledVerte.png');					// changer attr d'une balise ici src pour changer image
			}
			else if(message.moteur == "off")
			{
				$('#ledMoteur').attr('src','images/ledRouge.png');
			}
		});
					
		<!-- socket.on('temperature', function(message) {				<!-- Update temperature --> -->
			<!-- //alert('temperature : ' + message.temperature);		   -->
			<!-- console.log(message.temperature); -->
			<!-- if(message.temperature == "ok") -->
			<!-- { -->
				<!-- $('#ledTemperature').attr('src','images/ledVerte.png'); -->
			<!-- } -->
			<!-- else if(message.temperature == "nok") -->
			<!-- { -->
				<!-- $('#ledTemperature').attr('src','images/ledRouge.png'); -->
			<!-- } -->
		<!-- }) -->
		
		socket.on('tenderlift', function(message) {				<!-- Update position tenderlift via socket -->
			//alert('temperature : ' + message.temperature);
			if (message.position != etatTDL )
			{
				etatTDL = message.position;
				if(message.position == "montee")
				{
					$('#tdl').attr('src','images/monte.gif');
				}
				else if(message.position == "descente")
				{
					$('#tdl').attr('src','images/descente.gif');
				}
				else if(message.position == "droit")
				{
					$('#tdl').attr('src','images/TDL-5.png');
				}
			}
			
		});
		
		return 0;
	}

//-------------------------------------------------------------------------------------------
//-------------------------------- Commande Fleche Haut -------------------------------------
//-------------------------------------------------------------------------------------------

	flecheH = document.getElementById('flecheHaut');
	
	if (window.Touch)   													 // SI on est sur mobile 
	{ 
		flecheH.addEventListener('touchstart', function(e)					<!-- on verifie la securite avec button homme mort puis MONTER PASSERELLE -->
		{
			if(controleButtonPressed && ($('#flecheHaut').disabled == ''))								// SI homme mort on monte la passerelle
			{
				console.log('Bouton monter passerelle');
				$('#flecheHaut').attr('class','btn btn-secondary');		<!-- Changer couleur bouton (gitan) on peut aussi avec css ou attr -->
				$.post(newURL+"/monterPasserelle", {up:true,down:false} ,callbackPost); <!-- post json puis callbackPost -->
			}
		});
		  
		flecheH.addEventListener('touchend', function(e)			// Si on arrete de monter
		{
			if(controleButtonPressed)
			{
				console.log('Bouton descente passerelle');
				$('#flecheHaut').attr('class','btn btn-primary');		
				$.post(newURL+"/monterPasserelle", {up:false,down:false} ,callbackPost);		// arrêt montée
			}
	    });
	}	
	else														// Si on est sur pc 
	{
		$('#flecheHaut').on('mousedown', function() 		
		{
			if($('#controleCheck').is(':checked'))					// on verifie la securite avec checkbox puis POST : Monter Passerelle Click
			{
				console.log('Bouton descente passerelle');
				$('#flecheHaut').attr('class','btn btn-secondary');							// Changer couleur bouton
				$.post(newURL+"/monterPasserelle", {up:true,down:false} ,callbackPost);
				socket.emit('cmd', {TDL:"up"});
			}
		}).on('mouseup', function()											 <!-- POST : Monter Passerelle release -->
		{
			if($('#controleCheck').is(':checked'))
			{
				$('#flecheHaut').attr('class','btn btn-primary');		<!-- Changer couleur bouton -->
				$.post(newURL+"/monterPasserelle", {up:false,down:false} ,callbackPost); <!-- post json puis callbackPost -->
				socket.emit('cmd', {TDL:"stop"});
			}
		});
	}

//------------------------------------------------------------------------------------------
//-------------------------------- Commande Fleche Bas -------------------------------------
//------------------------------------------------------------------------------------------

	flecheB = document.getElementById('flecheBas');
	
	if (window.Touch) 											// on est sur mobile
	{ 
		flecheB.addEventListener('touchstart', function(e)					// Descendre PASSERELLE 
		{
			if(controleButtonPressed && ($('#flecheBas').disabled == ''))	// Si securite on descend
			{
				console.log('Bouton descente passerelle');
				$('#flecheBas').attr('class','btn btn-secondary');		// Changer couleur bouton
				$.post(newURL+"/descendrePasserelle", {up:false,down:true} ,callbackPost);
			}
		});
		  
		flecheB.addEventListener('touchend', function(e)				// Descendre Passerelle Release
		{
			if(controleButtonPressed)
			{
				$('#flecheBas').attr('class','btn btn-primary');		
				$.post(newURL+"/descendrePasserelle", {up:false,down:false} ,callbackPost); 		// on envoi arrêt
			}
	    });
	}
	else												// PC
	{			
		$('#flecheBas').on('mousedown', function() 		// POST : Descendre Passerelle
		{
			if($('#controleCheck').is(':checked'))			// si secutite checkbox activee
			{
				console.log('Bouton descente passerelle');
				$('#flecheBas').attr('class','btn btn-secondary');		// Changer couleur bouton
				$.post(newURL+"/descendrePasserelle", {up:false,down:true} ,callbackPost);				// on post
				socket.emit('cmd', {TDL:"down"});
			}
		}).on('mouseup', function() 						// POST : Descendre Passerelle release
		{
			if($('#controleCheck').is(':checked'))
			{
				$('#flecheBas').attr('class','btn btn-primary');
				$.post(newURL+"/descendrePasserelle", {up:false,down:false} ,callbackPost);				// Arrêt
				socket.emit('cmd', {TDL:"stop"});
			}
		});
	}

	

//------------------------------------------------------------------------------------
//-------------------------------- Authentification User -----------------------------
//------------------------------------------------------------------------------------
		
	$('#sendButon').on('click', function()			// POST : Auth admin ou utilisateur
	{											// Send button modal Auth
		var userName = $('#usr').val();
		var userPwd = $('#pwd').val();
		
		$.post(newURL+"/authentification", {name:userName,pwd:userPwd} ,callbackPostSend); <!-- post json -->
		
		function callbackPostSend(data, status)
		{
			console.log(status);
			console.log("callbackPostSend  :"+data.success);
			//if(status == "success")				// Si requete ok 
			if(data.success)				// Si donnees auth ok 
			{	
				if(userName == "admin")		// Si on se connecte en admin on ouvre la popup admin
				{
					socket = io.connect(newURL, { query: "admin=true" });				// Connexion Socket admin
					console.log("success sendButton");
					
					degriserBoutons();	
					
					connexionDataSocket(socket);			// Connexion pour recevoir les données 
					
					document.getElementById("alert").className = "alert alert-success";
					document.getElementById("alert-text").innerHTML  = " Bienvenu Admin";
					$("#modalAuth").modal('hide');		// ferme modal
					
					//acceptation Inviter en Admin uniquement
					socket.on('newInvite', function(message) 						// quand un nouvel invite on demande accptation
					{		
						$("#modalAccept").modal('show');						// popup accept ou non invite
							
						$('#acceptButton').on('click', function()			
						{	
							refreshTabInvit();
							socket.emit('inviteOk', {data:"invite"});				// on envoie la confirmation accpte user
							$("#modalAccept").modal('hide');				
						});
						
						$("#refuseInvButton").on('click', function()			// decline : invite = on suppr le last invite avec le post du user avec le dernier id
						{				
								$.post(newURL +"/deleteLastUser",callbackPost);			// Si admin deco user on post une suppression
											
								function callbackPost(data, status)
								{
									console.log(status);
									console.log(data.success);
													
									if(status == "success")
									{
										if(data.success)
										{
											console.log("success decoButton");
										}
										else
										{
											console.log("fail decoButton");
										}
									}
								}
						});
					});
				}
				else				
				{
					socket = io.connect(newURL, { query: "admin=except" });				// Connexion Socket utilisateur tenderlift
					console.log("success sendButton for users");
					
					degriserBoutons();	
					
					connexionDataSocket(socket);			// Connexion pour recevoir les données 
					
					document.getElementById("alert").className = "alert alert-success";
					document.getElementById("alert-text").innerHTML  = " Bienvenu";
					$("#modalAuth").modal('hide');		// ferme modal
				}
			}
			else
			{
			
				document.getElementById("alert-text").innerHTML  = " Echec connexion";
				console.log("fail sendButton");
				$("#messageInfo").html("Erreur Authentification");
			}
			
		}
	});
	
	$('#disconnectButton').on('click', function() <!--- Deconnexion -->
	{
		griserBoutons();

		socket.close();
		document.getElementById("alert-text").innerHTML  = " Session fermée";
	});
	
	

//-----------------------------------------------------------------------------------
//-------------------------------- Authentification Invité --------------------------
//-----------------------------------------------------------------------------------

	$('#inviteButton').on('click', function()		// INVITE Button
	{						
		$.post(newURL+"/invite", {demande:true} ,callbackPostSend); // post json 
		function callbackPostSend(data, status)
		{
			console.log(status);
			console.log(data.success);
			if(status == "success")			// si requete ok
			{
				if(data.success)			// si data ok 
				{	
					socket = io.connect(newURL, { query: "admin=false" });			// Connexion Socket 
					console.log("ok socket user invite");
					
					socket.on('inviteOkUser', function(message){					// Si l'admin est ok pour l'invite
					
						console.log("success inviteButton");
						
						degriserBoutons();
						document.getElementById("alert-text").innerHTML  = " Bienvenu - Session Active 180 secondes";
						connexionDataSocket(socket);		// Connexion pour recevoir les données 
					})
					
					socket.on('timeoutConnexion', function(message)								// if timeout Connexion
					{		
						alert("Deconnexion");
						griserBoutons();
						document.getElementById("alert-text").innerHTML  = " Session expirée";
						socket.close();
					})
				}
				else
				{
					console.log("fail invite");
				}
			}
		}
	});

//-----------------------------------------------------------------------------------
//-------------------------------- Tableau utilisateurs -----------------------------
//-----------------------------------------------------------------------------------

		function refreshTabInvit()
		{
			var userId;
			var tabId = [];
			
			$.get(newURL +"/users",callbackGet);					// demande des users
			function callbackGet(data, status) 
			{				
				console.log(status);
				console.log(data.users[0]);
				if(status == "success")						// si requete ok on met a jour l'affichage
				{	
					for(var i =0; i< data.users.length;i++)
					{
						tabId.push(parseInt(data.users[i].split("User")[1]));	// recup id user dans la chaine User23 par exmple
					}
													// prepare new row dans le tableau			
					
					//if(data.users.length > 0)
					//{
						for(var i=0; i< data.users.length;i++)		// remove previous user array
						{
							$("#ligne" + tabId[i]).remove();
						}
						
						for(var i =0; i< data.users.length;i++)
						{
							if(data.users[i] != null)
							{
								var newRows = "";	
								newRows += "<tr id=\"ligne" + (tabId[i])  + "\"" +  "><td>" + data.users[i] + "</td><td>" + 
										data.dateConnexion[i] + "</td><td> <button type=\"button\" class=\"decoButton\" id=\"" + (tabId[i]) + "\">Déconnecter</button></td></tr>";
								
								
								//if(!document.getElementById('ligne'+tabId[i]))
								//{
									$("#myTable").append(newRows);						// ajout de la ligne
									$('.decoButton').click(function() 					// ajout listener decoButton
										{
											$("#ligne" + this.id).remove();
										});
								//}
							}
						}
						$("#contentAdmin").height($("#contentAdmin").height()+(25*data.users.length));						
						//$("#contentAdmin").height(tailleDivAdmin+(25*data.users.length));						
					//}
				}				
			}
		}
//-----------------------------------------------------------------------------------