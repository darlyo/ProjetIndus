
	var socket;
	var socketAdmin;
	var tailleDivAdmin = 55;			// modif taille div userArray on new invite
	
	var droit =0;				//droit associer à l'utilisateur connecté:  1:admin			2:user
	var token = null;		//token envoyé pour vérifié la comunication
	var name = null;
	
	var newURL = window.location.protocol + "//" + window.location.host;
	
	//bouton de sécurité pour l'envoie de commande
	var controleButtonPressed = false;
	var isPc = false;
	var isPortable = false;
	
	var etatTDL = "droit";
	var g1, g2;		//gauges
		
	var init=true;
	var heightPageAdmin;
	if (init)
	{
		heightPageAdmin = $("#contentAdmin").height();	
		init = false;
	}
	
	//----- Changement d'onglet en administrateur
	$("#contentAdmin").hide();
	if(droit != 1)
		document.getElementById('admin').disabled = 'disabled';
	else
		document.getElementById('admin').disabled = '';

		
	$('#home').on('click', function() 		
	{
		$("#contentAdmin").hide();
		$("#contentHome").show();
		document.getElementById("alert").className = "alert alert-success";
		document.getElementById("alert-text").innerHTML  = " ";
	});
	
	$('#admin').on('click', function() 	
	{
		if(droit == 1)
		{
			refreshTabInvit();
			$("#contentAdmin").show();
			$("#contentHome").hide();
			document.getElementById("alert").className = "alert alert-success";
			document.getElementById("alert-text").innerHTML  = " ";
		}
		else
		{
			document.getElementById("alert").className = "alert alert-danger";
			document.getElementById("alert-text").innerHTML  = " Vous n'avez pas les droits requis";	
		}
	});
	
	$(window).bind('beforeunload',function(){

		griserBoutons();

		socket.close();
		droit =0;				//droit associer à l'utilisateur connecté:  1-admin		2-user
		token = null;		//token envoyé pour vérifier la communication
		name = null;
		socket = null;
		socketAdmin =null;
		
		$('#controleCheck').prop("checked", false);
});
	refreshTabInvit();						// recharge la liste des utilisateurs connectés
	
//--------------------------------------------------------------------------
//------------------------------- Jauge ------------------------------------
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
    isPc = false;									// si smartphone on crée un bouton de sécurité 'homme mort'
		isPortable = true;
		$('#controle').append("<button type=\"button\" class=\"btn btn-primary\" id=\"controleButton\" disabled=\"\">Contrôle</button>");	
		
		controlMouvement = document.getElementById('controleButton');
		
		controlMouvement.addEventListener('touchstart', function(e){				// listener pour activer la sécurité 'homme mort'
				controleButtonPressed =true;
			})
		//si le bouton est relaché on arrete les mouvements TDL
		controlMouvement.addEventListener('touchend', function(e){
				controleButtonPressed =false;
				$('#flecheHaut').attr('class','btn btn-primary');								<!-- Changer couleur bouton -->
				if (socket != null)
					socket.emit('cmd_stop',{'token':token, 'name':name});
				$('#flecheBas').attr('class','btn btn-primary');		
			})
			
		controlMouvement.addEventListener('touchleave', function(e){
				controleButtonPressed =false;
				$('#flecheHaut').attr('class','btn btn-primary');
				if (socket != null)
					socket.emit('cmd_stop',{'token':token, 'name':name});
				$('#flecheBas').attr('class','btn btn-primary');		
			})
			
		controlMouvement.addEventListener('touchcancel', function(e){
				controleButtonPressed =false;
				$('#flecheHaut').attr('class','btn btn-primary');		
				if (socket != null)
					socket.emit('cmd_stop',{'token':token, 'name':name}); 
				$('#flecheBas').attr('class','btn btn-primary');
			})
	}
	else
	{											// Si c'est un pc on met une checkbox pour la securite 'homme mort'
		isPc = true;
		isPortable = false;
		$('#controle').append("<label><input type=\"checkbox\" value=\"\" id=\"controleCheck\" >Contrôle</label>");
	}

//---------------------------------------------------------------------------------
//------------------------------------ Fonctions diverses --------------------------
//---------------------------------------------------------------------------------

	document.getElementById('flecheHaut').oncontextmenu = false;
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

//------------------------------------------------------------------------------------------------
//----------------------------Mise à jour des données---------------------------------------------
//------------------------------------------------------------------------------------------------

	function connexionDataSocket(socket){ 			<!------ Fonction de com par socket -------------------------------->
		
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
				$('#ledMoteur').attr('src','images/ledVerte.png');	
			}
			else if(message.moteur == "off")
			{
				$('#ledMoteur').attr('src','images/ledRouge.png');
			}
		});
					
		socket.on('temperature', function(message) {				 //Update température  
			console.log(message.temperature); 
			if(message.temperature == "ok") 
				$('#ledTemperature').attr('src','images/ledVerte.png'); 
			else if(message.temperature == "nok") 
				$('#ledTemperature').attr('src','images/ledRouge.png'); 
		});
		
		socket.on('tenderlift', function(message) {					//Update position tenderlift via socket
			//alert('temperature : ' + message.temperature);
			if (message.position != etatTDL )
			{
				etatTDL = message.position;
				if(message.position == "montee")
					$('#tdl').attr('src','images/monte.gif');
				else if(message.position == "descente")
					$('#tdl').attr('src','images/descente.gif');
				else if(message.position == "droit")
					$('#tdl').attr('src','images/TDL-5.png');
			}
		});
		
		socket.on('timeoutConnexion', function(message)								// if timeout Connexion
		{		
			alert("Deconnexion");
			griserBoutons();
			
			document.getElementById("alert").className = "alert alert-danger";
			document.getElementById("alert-text").innerHTML  = " Session expirée";
			// On vide les parametre de session
			socket.close();
			droit =0;				
			token = null;	
			name = null;
			socket = null;
			socketAdmin =null;
			//on affiche la page d'accueil , controle de la plateforme Tenderlift
			$("#contentAdmin").hide();
			$("#contentHome").show();
		});
		
		socket.on('erreurCan', function(message)								// if problème de communication avec le CR3131
		{
			document.getElementById("alert").className = "alert alert-danger";
			document.getElementById("alert-text").innerHTML  = " ERREUR : réseau CAN indisponible, veuillez réessayer";
		});
		
		socket.on('CanOK', function(message)								// if problème de communication avec le CR3131
		{
			document.getElementById("alert").className = "alert alert-success";
			document.getElementById("alert-text").innerHTML  = " Connexion CAN établie";
		});
		
		socket.on('add_user_OK', function(message)
		{
			if (message.ok == 1)
			{
				document.getElementById("alert").className = "alert alert-success";
				document.getElementById("alert-text").innerHTML  = " Utilisateur ajouter";
			}
			else
			{
				document.getElementById("alert").className = "alert alert-danger";
				document.getElementById("alert-text").innerHTML  = " Impossible d'ajout l'utilisateur, ce nom d'utilisateur est déjà utilisé ";
			}
		});
	}
	
	function callbackAuth(message, status){
		console.log("retour authentification "+message);
		if(message.success)				// Si données auth ok 
		{	
			$("#modalAuth").modal('hide');		// on ferme le modal d'authentification

			droit = message.droit;
			token = message.token;
			name = message.name;
			
			console.log("success sendButton");
			degriserBoutons();
			socket = io.connect(newURL, { query: {'name':name}});			// Connexion Socket 
			connexionDataSocket(socket);			// Connexion pour recevoir les données 
			
			document.getElementById("alert").className = "alert alert-success";
			document.getElementById("alert-text").innerHTML  = " Bienvenu "+message.name;
			$("#modalAuth").modal('hide');		// ferme le modal
			
			if(droit == 1)		// Si on se connecte avec les droit d'amin on peut acepter une demande de connexion d'un invité
			{
				//on definit l'utilisateur comme admin en charge des invitations
				socket.emit('isAdmin', { "name":name, "token":token });

				//acceptation inviter en Admin uniquement
				socket.on('newInvite', function(message)
				{		
					$("#modalAccept").modal('show');						// popup accept ou non invite
						
					$('#acceptButton').on('click', function()			
					{	
						refreshTabInvit();
						socket.emit('inviteOk', {data:"invite", "token":token});				// on envoie la confirmation accepte user
						$("#modalAccept").modal('hide');				
					});
					$('#declineButton').on('click', function()			
					{	
						socket.emit('inviteNon', {data:"invite", "token":token});				// on envoie le refus de de connexion e l'invité
						$("#modalAccept").modal('hide');				
					});
				});
			}
		}
		else
		{
			document.getElementById("alert").className = "alert alert-danger";
			document.getElementById("alert-text").innerHTML  = " Echec connexion";
			console.log(" Echec connexion: "+ message.info);
			$("#messageInfo").html(" Echec connexion: "+ message.info);
		}
	}

//-------------------------------------------------------------------------------------------
//-------------------------------- Commande Fleche Haut -------------------------------------
//-------------------------------------------------------------------------------------------

	flecheH = document.getElementById('flecheHaut');
	
	if (window.Touch)   													 // SI on est sur smartephone 
	{ 
		flecheH.addEventListener('touchstart', function(e)
		{
			if(controleButtonPressed && ($('#flecheHaut').disabled == ''))		// SI 'homme mort' on monte la passerelle
			{
				console.log('Bouton monter passerelle');
				$('#flecheHaut').attr('class','btn btn-secondary');	
				if (socket != null)
					socket.emit('cmd_up',{'token':token, 'name':name});
			}
		});
		  
		flecheH.addEventListener('touchend', function(e)			// Si on lache le boutton, on arrête la monter
		{
			if(controleButtonPressed)
			{
				console.log('Bouton descente passerelle');
				$('#flecheHaut').attr('class','btn btn-primary');		
				if (socket != null)
					socket.emit('cmd_stop',{'token':token, 'name':name});
			}
	    });
	}	
	else														// Si on est sur pc 
	{
		$('#flecheHaut').on('mousedown', function() 		
		{
			if($('#controleCheck').is(':checked'))					// on vérifie la sécurite avec checkbox
			{
				console.log('Bouton descente passerelle');
				$('#flecheHaut').attr('class','btn btn-secondary');		
				if (socket != null)
					socket.emit('cmd_up',{'token':token, 'name':name});
			}
		}).on('mouseup', function()						
		{
			if($('#controleCheck').is(':checked'))
			{
				$('#flecheHaut').attr('class','btn btn-primary');			
				if (socket != null)
					socket.emit('cmd_stop',{'token':token, 'name':name});
			}
		}).on('mouseout', function()					
		{
			if($('#controleCheck').is(':checked'))
			{
				$('#flecheHaut').attr('class','btn btn-primary');		
				if (socket != null)
					socket.emit('cmd_stop',{'token':token, 'name':name});
			}
		});
	}

//------------------------------------------------------------------------------------------
//-------------------------------- Commande Fleche Bas -------------------------------------
//------------------------------------------------------------------------------------------

	flecheB = document.getElementById('flecheBas');
	
	if (window.Touch) 											// on est sur smartphone
	{ 
		flecheB.addEventListener('touchstart', function(e)					// Descendre PASSERELLE 
		{
			if(controleButtonPressed && ($('#flecheBas').disabled == ''))	// Si securite on descend
			{
				console.log('Bouton descente passerelle');
				$('#flecheBas').attr('class','btn btn-secondary');			
				if (socket != null)
					socket.emit('cmd_down',{'token':token, 'name':name});
			}
		});
		  
		flecheB.addEventListener('touchend', function(e)						// Descendre Passerelle Release
		{
			if(controleButtonPressed)
			{
				$('#flecheBas').attr('class','btn btn-primary');		
				if (socket != null)
					socket.emit('cmd_stop',{'token':token, 'name':name});
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
				$('#flecheBas').attr('class','btn btn-secondary');		
				if (socket != null)
					socket.emit('cmd_down',{'token':token, 'name':name});
			}
		}).on('mouseup', function() 								// POST : Descendre Passerelle release
		{
			if($('#controleCheck').is(':checked'))
			{
				$('#flecheBas').attr('class','btn btn-primary');
				if (socket != null)
					socket.emit('cmd_stop',{'token':token, 'name':name});
			}
		}).on('mouseout', function() 						// POST : Descendre Passerelle release
		{
			if($('#controleCheck').is(':checked'))
			{
				$('#flecheBas').attr('class','btn btn-primary');
				if (socket != null)
					socket.emit('cmd_stop',{'token':token, 'name':name});
			}
		});
	}
	

//------------------------------------------------------------------------------------
//------------------------------------ Ajoute User -----------------------------------
//------------------------------------------------------------------------------------
		
	$('#add_user').on('click', function()			// POST : Auth admin ou utilisateur
	{	
		var userName = $('#new_usr').val();
		var userPwd = $('#new_pwd').val();
		if ((userName.length > 0) && (userPwd.length >= 4))
		{
			socket.emit('add_user', {'token':token, 'name':name, 'new_user':userName, 'new_pwd':userPwd });
			$('#new_usr').val("");
			$('#new_pwd').val("");
		}
		else if ((userPwd.length < 4) && (userName.length > 0))
		{
			document.getElementById("alert").className = "alert alert-danger";
			document.getElementById("alert-text").innerHTML  = " Veuillez saisir un mot de passe de 4 caractères minimun";
		}
		else
		{
			document.getElementById("alert").className = "alert alert-danger";
			document.getElementById("alert-text").innerHTML  = " Veuillez saisir un nom d'utilisateur et un mot de passe avant d'ajouter un utlisateur";
		}
		
	});
	
//------------------------------------------------------------------------------------
//-------------------------------- Authentification User -----------------------------
//------------------------------------------------------------------------------------
		
	$('#sendButon').on('click', function()			// POST : Auth admin ou utilisateur
	{	
		var userName = $('#usr').val();
		var userPwd = $('#pwd').val();

		$.post(newURL+"/authentification", {"name":userName,"pwd":userPwd},callbackAuth); 
	});
	
	$('#disconnectButton').on('click', function() <!--- Deconnexion -->
	{
		griserBoutons();
		$.post(newURL +"/decoUser", {'name': name});					// déconnecte l'utilisateur courant

		socket.close();
		droit =0;				//droit associer à l'utilisateur connecté:  1-admin		2-user
		token = null;		//token envoyé pour vérifier la communication
		name = null;
		socket = null;
		socketAdmin =null;
		
		$("#contentAdmin").hide();
		$("#contentHome").show();
		$('#controleCheck').prop("checked", false);
		document.getElementById("alert").className = "alert alert-danger";
		document.getElementById("alert-text").innerHTML  = " Session fermée";
	});
	
	

//-----------------------------------------------------------------------------------
//-------------------------------- Authentification Invité --------------------------
//-----------------------------------------------------------------------------------

	$('#inviteButton').on('click', function()		// INVITE Button
	{						
		$.post(newURL+"/invite",callbackPostSend); // post json 
		function callbackPostSend(data, status)
		{
			console.log(status);
			console.log(data.success);
			if(status == "success")			// si requete ok
			{
				if(data.success)			// si data ok 
				{	
					if(socket != null)
						socket.close();
					socket = io.connect(newURL, {secure: true, query: "invite=true" });			// Connexion Socket 
					console.log("ok socket user invite");
					
					socket.on('inviteOkUser', function(message){					// Si l'admin est ok pour l'invite
						if(message.demande){
							socket.removeListener('inviteOkUser');
							console.log("success inviteButton");
							droit = 2;
							token = message.token;
							name = message.name;

							degriserBoutons();
							document.getElementById("alert").className = "alert alert-success";
							document.getElementById("alert-text").innerHTML  = " Bienvenu - Session Active 5 minutes";
							connexionDataSocket(socket);		// Connexion pour recevoir les données 
						}
						else{
							document.getElementById("alert").className = "alert alert-danger";
							document.getElementById("alert-text").innerHTML  = " Echec de connexion";
						}
					})
				}
				else
				{
					document.getElementById("alert").className = "alert alert-danger";
					document.getElementById("alert-text").innerHTML  = " Echec de connexion";
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
			
			$.get(newURL +"/users",callbackGet);					// demande de la liste des utilisateur connectés
			function callbackGet(data, status) 
			{				
				console.log(status);
				console.log(data.users[0]);
				if(status == "success")						// on met a jour l'affichage
				{	
					// on supprime ke tableau précédent
					$("#myTable tr").remove();
					
					// mise a jour du tableau
					for(var i =0; i< data.users.length;i++)
					{
						if(data.users[i] != null)
						{
							var newRows = "";	
							newRows += "<tr id=\"ligne" + (i)  + "\"" +  "><td class=\"td1\">" + data.users[i] + "</td><td class=\"td2\">" + data.dateConnexion[i] + "</td><td class=\"td3\"> <button type=\"button\" class=\"	 decoButton btn btn-default\" id=\"" +i + "\">Déconnecter</button></td></tr>";

							$("#myTable").append(newRows);						// ajout de la ligne
							$('.decoButton').click(function() 					// ajout listener decoButton
							{
								$("#ligne" + this.id).remove();
								$.post(newURL +"/decoUser", {name: data.users[this.id]} ,callbackGet);					// demande des users
							});
						}
					}
					$("#contentAdmin").height(heightPageAdmin+(25*data.users.length));						
				}				
			}
		}
//-----------------------------------------------------------------------------------