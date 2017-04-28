function padStart(str, count) {
		str += ''; 
		while(str.length < count)
			str = '0'+str;
    return str;
};

//Chnage le format endainness
// Parmametre: un entier
// returne : une string de l'entier avec l'indian inverssé 
function swapEndianness(v)
{
	var s = v.toString(16);             // translate to hexadecimal notation
	s = s.replace(/^(.(..)*)$/, "0$1"); // add a leading zero if needed
	var a = s.match(/../g);             // split number in groups of two
	a.reverse();                        // reverse the groups
	var s2 = a.join("");                // join the groups back together
	return s2;
}

//Retourne un nombre sous sa forme binaire en 32bits
// Parametre : un entier entre -2147483648 and 2147483647
// Return : une string de l'entier en bianire
function createBinaryString (nMask, size = 32) {
	for (var nFlag = 0, nShifted = nMask, sMask = ""; nFlag < 32;
		nFlag++, sMask += String(nShifted >>> 31), nShifted <<= 1);
	console.log(sMask);
	sMask = sMask.slice(32-size,32);
	console.log(sMask);
	return sMask;
}
// Exemple
// console.log(createBinaryString(0x0001));  	--> 00000000000000000000000000000001
// console.log(createBinaryString(-3));			--> 11111111111111111111111111111101
// console.log(createBinaryString(0x7fff));		--> 00000000000000000111111111111111



//calcule le checksum d'un message Can
// Parametre : message Can (SOF, length, commande, data-bytes)
// Return : XOR checksum
function checksum(s)
{
	s = s.replace(/^(.(..)*)$/, "0$1"); // add a leading zero if needed
	var a = s.match(/../g);             // split number in groups of two
	var C = a[0];
	for( var i=1; i<a.length;i++ )
	{
		C = C ^ a[i];
	}
	// console.log(a);
	// console.log(C);
	return C;
}
//-----------------Conersion Can to entier --------------------------
//BYTE	0				255				8 Bit
// USINT:	0				255				8 Bit
function canToByte(v){
	var s1 = createBinaryString('0x'+v,8);
	// console.log(parseInt(s1,2));
	return parseInt(s1,2);
}

// WORD 	0				65535			16 Bit
// UINT:	0				65535			16 Bit
function canToWord(v){
	var s1 = '0x'+ swapEndianness(v);
	s1 = createBinaryString(s1,16);
	// console.log(parseInt(s1,2));
	return parseInt(s1,2);
}

// DWORD	0				4294967295		32 Bit
// UDINT:	0				4294967295		32 Bit
function canToDWord(v){
	var s1 = '0x'+ swapEndianness(v);
	s1 = createBinaryString(s1);
	// console.log(parseInt(s1,2));
	return parseInt(s1,2);
}

// SINT: 	-128			127				8 Bit
function canToSInt(v)
{
	var s1 = '0x'+ swapEndianness(v);
	s1 = createBinaryString(s1,8);
	var res = parseInt(s1,2);
	if (res >= 128)
		res = res - 128*2;
	return res;
}

// DINT:	-2147483648		2147483647		32 Bit
function canToDInt(v)
{
	var s1 = '0x'+ swapEndianness(v);
	s1 = createBinaryString(s1);
	var res = parseInt(s1,2);
	if (res >= 2147483648)
		res = res - 2147483648*2;
	return res;
}

// INT:	-32768			32767			16 Bit	
function canToInt(v)
{
	// console.log(v);
	var s1 = '0x'+ swapEndianness(v);
	s1 = createBinaryString(s1,16);
	var res = parseInt(s1,2);
	// console.log(res);
	// console.log('comp '+createBinaryString(s1 & 0x8000));
	if (res >= 32768)
		res = res - 32768*2;
	console.log(res +'\n');
	return res;
}

//-------------------------Conversion Entier to Can-------------------------
// BYTE		0				255				8 Bit
// USINT:	0				255				8 Bit
function byteToCan(v){
	var res = '' + v.toString(16);
	while (res.length < 2) res = '0' + res;
	// console.log(res+'\n');
	return res;
}

// WORD 	0				65535			16 Bit
// UINT:	0				65535			16 Bit
function wordToCan(v){
	var res = ''+v.toString(16);
	while (res.length < 4) res = '0' + res;
	res = swapEndianness(res);
	// console.log(res+'\n');
	return res;
}

// DWORD	0				4294967295		32 Bit
// UDINT:	0				4294967295		32 Bit
function dWordToCan(v){
	var res = ''+v.toString(16);
	while (res.length < 8) res = '0' + res;
	res = swapEndianness(res);
	console.log(res+'\n');
	return res;
}

// SINT: 	-128			127				8 Bit
function sIntToCan(v)
{
	if((v<-128) ||(v>127))
		return NaN;

	var v1 = v<0?-v:v;
	// console.log(v);
	v1 = (v <0) && (v != -128)? v1+0x80:v1;
	res = ''+v1.toString(16);
	while (res.length < 2) res = '0' + res;
	// console.log(res+'\n');
	return res;
}

// DINT:	-2147483648		2147483647		32 Bit
function dIntToCan(v)
{
	if((v<-2147483648) ||(v>2147483647))
		return NaN;

	var v1 = v<0?-v:v;
	console.log(v);
	v1 = (v <0) && (v != -2147483648)? v1+0x80000000:v1;
	res = ''+v1.toString(16);
	while (res.length < 8) res = '0' + res;
	res = swapEndianness(res);
	console.log(res+'\n');
	return res;
}

// INT:	-32768			32767			16 Bit	
function intToCan(v)
{
	if((v<-32768) ||(v>32767))
		return NaN;

	var v1 = v<0?-v:v;
	console.log(v);
	v1 = (v <0) && (v != -32768)? v1+0x8000:v1;
	res = ''+v1.toString(16);
	while (res.length < 4) res = '0' + res;
	res = swapEndianness(res);
	console.log(res+'\n');
	return res;
}

//Construit un message Can valide
//Parametre:
//	id : l'id sur le quel le message est envoyé
//	map : un tableau clé/valeur pour les datas
//			la clé correspond au type de donnée (Int, Bool, ...)
//			la valeur est la donnée envoyé
//Return: une string contenant le message valide
// !!! manque la gestion du real
function buildMsg(id, tab){
	
	var sof = 0x43;
	var dlc = 0;
	var data ='';
	console.log('size tab ='+tab["length"]);
	//extraction des donnée de map
	for (var i =0; i<tab["length"];i++) {
		// console.log(tab[i].type + " = " + tab[i].value);
		var v;
		switch (tab[i].type){
			case 'byte':
				v = byteToCan(tab[i].value);
				break;
			case 'word':
				v = wordToCan(tab[i].value);
				break;
			case 'dword':
				v = dWordToCan(tab[i].value);
				break;
			case 'sint':
				v = sIntToCan(tab[i].value);
				break;
			case 'usint':
				v = byteToCan(tab[i].value);
				break;
			case 'int':
				v = intToCan(tab[i].value);
				break;
			case 'uint':
				v = wordToCan(tab[i].value);
				break;
			case 'dint':
				v = dIntToCan(tab[i].value);
				break;
			case 'udint':
				v = dWordToCan(tab[i].value);
				break;
			case 'bool':
				v= tab[i].value?'01':'00';
				break;			  
		}
		// console.log('value :'+v);
		data += v;
		// console.log('size elements :' + v.length)
		dlc += v.length/2;
	}
  // console.log('dlc : '+ dlc);
  // console.log('data :'+data);
	var cmd = dlc +3
	var eof = 0x0d; 
	
	var msg = sof.toString(16)+padStart(cmd,2) + padStart(id.toString(16),6)+data;
	// console.log('msg :'+msg);
	var check = ''+checksum(msg);		// checksum du 
  // console.log('check :'+check);

	// compute the required buffer length
	var bufferSize = 2 + 3 + dlc + 2;
	var buffer = new Buffer(bufferSize);
	buffer.fill(0);

	// store first byte on index 0;
	buffer.writeUIntBE(sof, 0,1);
	buffer.writeUIntBE(dlc+3, 1, 1);
	buffer.writeUIntBE(id, 2, 3);
	buffer.writeUIntBE('0x'+data, 5, dlc );
	buffer.writeUIntBE('0x'+check, 5+dlc, 1);
	buffer.writeUIntBE(eof, 6+dlc, 1);
	
  console.log(buffer);

} 
console.log('debut');
// checksum('43050000010100');
// var maMap = new Map();
// maMap.set('bool',true); 
// maMap.set('bool',false);
var tab = []
tab[0] = {type: 'bool', value:true};
tab[1] = {type: 'bool', value:false};
buildMsg(1,tab);

// console.log((-10).toString(16));