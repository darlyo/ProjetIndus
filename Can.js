
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
function createBinaryString (nMask) {
  for (var nFlag = 0, nShifted = nMask, sMask = ""; nFlag < 32;
       nFlag++, sMask += String(nShifted >>> 31), nShifted <<= 1);
  return sMask;
}
// Exemple
// console.log(createBinaryString(0x0001));  	--> 00000000000000000000000000000001
// console.log(createBinaryString(-3));			--> 11111111111111111111111111111101
// console.log(createBinaryString(0x7fff));		--> 00000000000000000111111111111111

function toInt(v)
{
	console.log(v);
	var s1 = '0x'+ swapEndianness(v);
	console.log(s1);
	s1 = createBinaryString(s1);
	console.log(s1);
	s1 = s1.slice(16,32);
	console.log(s1);
	if (s1 & '1000000000000000')
		console.log('negatif');
}

toInt('0f80');