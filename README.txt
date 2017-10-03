Mise en place du serveur:

On installe sur la machine serveur
Nodejs, npm
puis les module nodejs suivant : 
crypto, redis, express, path, favicon, bodyParser, net, fs, https

On installe la base de donnée redis
sur le port par default 6379
lancer le demarrage du serveur redis automatique au démarrage.
Sinon vérifié avant quand on veux se servir du serveur que redis est bien lancé.

On peut récupèrer le projet ensuite via le github:
https://github.com/darlyo/ProjetIndus.git

Le serveur communique avec le CR3131, module CAN/wierless, avec :
port 30000
ip 192.168.173.246
l'on peut récupèrer et modifié ces valeurs avec maintenance tool
Il faut configurér pour que le CR3131 se connecté au même réseau wifi que la machine serveur.

Le serveur utilise un certificat SSL
la clef est le certificat son fournit avec le projet.
Pour en géner un nouveau suivre: 
https://doc.ubuntu-fr.org/tutoriel/comment_creer_un_certificat_ssl

Lancement serveur
pour initialisé la bdd on lance
node initBdd.js

Puis on lance le serveur avec 
node app.js

On se connecte au serveur en https sur le port 3300
en localhost : https://127.0.0.1:3300

Récupèrer des messages CAN:
On modifie la focntion "traitementMsg" de app.js
On rajoute un cas dans le switch pour l'id du message à traiter. Puis récupère chaque variable avec : 
	parseInt(can.swapEndianness(msg.slice(6,10)),16);
	6 et 10 représente l'indice de debut et de fin de la valeur.
	un boolean aura un taille de 2 (exemple de 6 à 8)
taille 2: Bool, Byte, Sint
taille 4: Word, Int
taille 8: Dword, Dint

Pour envoyé des messages:
On crée un tableau de données, ou pour chaque donnée on renseigne le type et la valeur
	var data =[];
	data[0] = {type: 'bool', value:up};
	data[1] = {type: 'bool', value:down};	
Puis on réupère notre message à envoyé dans un buffer avec la fonction buildMsg du module CAN:
	var msg = Buffer.from(can.buildMsg(10,data));
Il suffit ensuite d'envoyé par socket le message au CR3131:
	client.write(msg,'data');

