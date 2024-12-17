"use strict";

function fadeIn(element) {
    "use strict";

    element.style.opacity = 0;
    element.style.display = "block";
    var i = 0;
    var inte = setInterval(function() {
        element.style.opacity = Number(element.style.opacity) + 0.3;

        if (i >= 2) {
            clearInterval(inte);
        } else {
            i++;
        }
    }, 65);
}

function hide(element) {
    "use strict";

    element.style.display = "none";
}

window.onload = function() {
    "use strict";

    var encode = document.getElementById("encode");
    var decode = document.getElementById("decode");

    var encodeBack = document.getElementById("encodeBack");
    var decodeBack = document.getElementById("decodeBack");

    var txtEncrypt = document.getElementById("txtEncrypt");
    var txtDecrypt = document.getElementById("txtDecrypt");

    var btnEncrypt = document.getElementById("btnEncrypt");
    var btnDecrypt = document.getElementById("btnDecrypt");

    var encryptResult = document.getElementById("resultEncrypt");
    var decryptResult = document.getElementById("resultDecrypt");

    var mainDiv = document.getElementById("mainDiv");
    var encodeDiv = document.getElementById("encodeDiv");
    var decodeDiv = document.getElementById("decodeDiv");

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

    /// encode and decode function
    encode.onclick = function() {
        hide(mainDiv);
        fadeIn(encodeDiv);
    }

    decode.onclick = function() {
        hide(mainDiv);
        fadeIn(decodeDiv);
    }

    encodeBack.onclick = function() {
        hide(encodeDiv);
        fadeIn(mainDiv);
    }

    decodeBack.onclick = function() {
        hide(decodeDiv);
        fadeIn(mainDiv);
    }

    btnEncrypt.onclick = function() {
        var text = txtEncrypt.value.trim().toUpperCase().split("");
        var code = "";

        for (var i in text) {
            code += symbols[letters.indexOf(text[i])] + " ";
        }

        encryptResult.innerText = code;

        fadeIn(encryptResult);
    }

    btnDecrypt.onclick = function() {
        var code = txtDecrypt.value.trim().replace(/_|¯|—|–/g, "-").split(" ");
        var text = "";

        for (var i in code) {
            text += letters[symbols.indexOf(code[i])];
        }

        decryptResult.innerText = text.replace("undefined", " ");

        fadeIn(decryptResult);
    }
}