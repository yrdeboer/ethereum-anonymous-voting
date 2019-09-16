export function stringToHex(str, maxLength) {

    var len = Math.min(str.length, maxLength);
    var hex = '';
    for(var i=0;i<len;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return hex;
}


export function hexToString (hexstr) {

    var str = '';
    for (var i = 0; (i < hexstr.length && hexstr.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hexstr.substr(i, 2), 16));
    return str;
}
