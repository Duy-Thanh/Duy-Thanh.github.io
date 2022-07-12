var encryptResult = undefined;
var decryptResult = undefined;

var letters = 
[
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    " ",
    ".",
    ",",
    "?",
    "'",
    "!",
    "/",
    "(",
    ")",
    "&",
    ":",
    ";",
    "=",
    "+",
    "-",
    "_",
    "\"",
    "$",
    "@",
    "¿",
    "¡",
    "\n"
];

var symbols = 
[
    ".-",
    "-...",
    "-.-.",
    "-..",
    ".",
    "..-.",
    "--.",
    "....",
    "..",
    ".---",
    "-.-",
    ".-..",
    "--",
    "-.",
    "---",
    ".--.",
    "--.-",
    ".-.",
    "...",
    "-",
    "..-",
    "...-",
    ".--",
    "-..-",
    "-.--",
    "--..",
    "-----",
    ".----",
    "..---",
    "...--",
    "....-",
    ".....",
    "-....",
    "--...",
    "---..",
    "----.",
    "/",
    ".-.-.-",
    "--..--",
    "..--..",
    ".----.",
    "-.-.--",
    "-..-.",
    "-.--.",
    "-.--.-",
    ".-...",
    "---...",
    "-.-.-.",
    "-...-",
    ".-.-.",
    "-....-",
    "..--.-",
    ".-..-.",
    "...-..-",
    ".--.-.",
    "..-.-",
    "--...-",
    "\n"
];

function unicodeToChar(text) {
    return text.replace(/\\u[\dA-F]{4}/gi, 
        function (match) {
            return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
}

function encrypt(encrypt = undefined) {
    var text = encrypt.trim().toUpperCase().split("");
    var code = "";

    for (var i in text) {
        code += symbols[letters.indexOf(text[i])] + " ";
    }

    encryptResult = code;
}

function fetchParams()
{
    encrypt(decodeURI(window.location.search.substring(8).toString()));

    document.getElementById("result").innerHTML = encryptResult;
}
