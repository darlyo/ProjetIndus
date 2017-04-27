
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
// Parametre : message Can (SOF, lenght, commande, data-bytes)
// Return : XOR checksum
function checksum(s)
{
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

//BYTE	0				255				8 Bit
// USINT:	0				255				8 Bit
function canToByte(v){
	var s1 = createBinaryString('0x'+v,8);
	console.log(parseInt(s1,2);
	return parseInt(s1,2);
}

// WORD 	0				65535			16 Bit
// UINT:	0				65535			16 Bit
function canToWord(v){
	var s1 = '0x'+ swapEndianness(v);
	s1 = createBinaryString(s1,16);
	console.log(parseInt(s1,2);
	return parseInt(s1,2);
}

// DWORD	0				4294967295		32 Bit
// UDINT:	0				4294967295		32 Bit
function canToDWord(v){
	var s1 = '0x'+ swapEndianness(v);
	s1 = createBinaryString(s1);
	console.log(parseInt(s1,2);
	return parseInt(s1,2);
}

// SINT: 	-128			127				8 Bit
function canToSInt(v)
{
	var s1 = '0x'+ swapEndianness(v);
	s1 = createBinaryString(s1,8);
	var res = parseInt(s1,2)
	if (res >= 128)
		res = res - 128*2;
	return res;
}

// DINT:	-2147483648		2147483647		32 Bit
function canToDInt(v)
{
	var s1 = '0x'+ swapEndianness(v);
	s1 = createBinaryString(s1);
	var res = parseInt(s1,2)
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
	var res = parseInt(s1,2)
	// console.log(res);
	// console.log('comp '+createBinaryString(s1 & 0x8000));
	if (res >= 32768)
		res = res - 32768*2;
	console.log(res +'\n');
	return res;
}

//Construit un message Can valide
//Parametre:
//	id : l'id sur le quel le message est envoyé
//	map : un tableau clé/valeur pour les datas
//			la clé correspond au type de donnée (Int, Bool, ...)
//			la valeur est la donnée envoyé
//Return: une string contenant le message valide
function buildMsg(id, map){
	
	var sof = 0x43;
	var dlc = 3;
	var data;
	//extraction des donnée de map
	for (var [cle, valeur] of maMap.entries()) {
		console.log(cle + " = " + valeur);
		switch (cle){
			case 'int':
				dlc += 3;
				// data += 
				break;
			case 'bool':
			dlc += 1;
			
				break;
		}
	}
  
	var check;		// checksum du 
	var eof = 0x0d; 
	
	// compute the required buffer length
	var bufferSize = 2 + dlc + 2;
	var buffer = new Buffer(bufferSize);

	// store first byte on index 0;
	buffer.writeUInt16BE(sof, 0);
	buffer.writeUIntBE(id, 2, 3);
	buffer.writeUIntBE(up, 5, 1);
	buffer.writeUIntBE(down, 6, 1);
	buffer.writeUIntBE(eof, 7, 2);
}
checksum('43050000010100');
canToInt('0180');
canToInt('0100');
canToInt('ffff');
canToInt('ff7f');

console.log((-10).toString(16));