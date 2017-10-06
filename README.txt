-----------------------------------------------------------
----------------- Mise en place du serveur ----------------
-----------------------------------------------------------
Mise à jour système:
	sudo apt-get upgrade
	sudo apt-get update
	
Installation le serveur (Nodejs, redis, git):
	sudo apt-get install npm nodejs nodejs-legacy curl

On installe la base de donnée redis
	sudo apt-get install redis-server redis-tools
sur le port par default 6379

On récupère le projet ensuite via le github
on installe git:
	sudo apt-get install git
Récupèration dépot git:
	git clone https://github.com/darlyo/ProjetIndus.git
mise à jour du depot git:
	git pull
Charge la version désiré	
	git checkout master

On se deplace dans le dossier du projet:
	cd ProjetIndus
puis on met à jour les module nodejs suivant (pour des résont de compatibilité système:
	npm install crypto redis express path serve-favicon body-parser net fs https socket.io
(les modules sont fournies dans le projet git. )


Le serveur utilise un certificat SSL
la clef est le certificat son fournit avec le projet.
Pour en géner un nouveau suivre: 
https://doc.ubuntu-fr.org/tutoriel/comment_creer_un_certificat_ssl
Et on remplace les fichier "key.pem" et "cert.pem"


Le serveur communique avec le CR3131, module CAN/wierless.
On vérifie la configuration du CR3131 avec maintenance tools
	port: 30000
	ip 	:	192.168.173.246
Il possible d'utiliser un autre numero de port et une autres ip. 
Dans se cas il faut modifier les lignes 21 et 22 du fichier "app.js")
Il faut configurér pour que le CR3131 se connecté au même réseau wifi que la machine serveur.

----------------------------------------------------------------
------------------- Démarrer le serveur ------------------------
----------------------------------------------------------------

Lancement serveur
pour initialisé la bdd on lance 
(attention : reset la base de données, on perd les utilisateur ajouté manuellement)
	node initBdd.js

Puis on lance le serveur avec 
	node app.js

On se connecte au serveur en https sur le port 3300
en localhost : https://127.0.0.1:3300

----------------------------------------------------------------
--------------------- Configuration  ---------------------------
----------------------------------------------------------------

Récupèrer des messages CAN:
On modifie la focntion "traitementMsg" de app.js
On rajoute un cas dans le switch pour l'id du message à traiter. Puis récupère chaque variable avec : 
	parseInt(can.swapEndianness(msg.slice(6,10)),16);
	6 et 10 représente l'indice de debut et de fin de la valeur.
	un boolean aura un taille de 2 (exemple de 6 à 8)
taille 2: Bool, Byte, Sint
taille 4: Word, Int
taille 8: Dword, Dint

Pour envoyer des messages:
On crée un tableau de données, ou pour chaque donnée on renseigne le type et la valeur
	var data =[];
	data[0] = {type: 'bool', value:up};
	data[1] = {type: 'bool', value:down};	
Puis on réupère notre message à envoyé dans un buffer avec la fonction buildMsg du module CAN:
	var msg = Buffer.from(can.buildMsg(10,data));
Il suffit ensuite d'envoyé par socket le message au CR3131:
	client.write(msg,'data');

On peut modifier la base de donnée initial dans le fichier: initBdd.js
la ligne :
	redis.createUser("paul","paul",2);
permet de crée un utilisateur (nom, mot de passe, droit)
pour le droit : 1 (administarteur)
								2 (utulisateur normal)
