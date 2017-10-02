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


Lancement serveur
pour initialisé la bdd on lance
node initBdd.js

Puis on lance le serveur avec 
node app.js

On se connecte au serveur en https sur le port 3300
en localhost : https://127.0.0.1:3300

