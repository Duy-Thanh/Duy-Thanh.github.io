#include <stdio.h>
#include <iostream>
#include <stdlib.h>

int exitCode = 0;

std::string output = "";

std::string update(std::string url, std::string savePath) {
    std::cout << "URL: " << url << std::endl;
    std::cout << "Save path: " << savePath << std::endl;

    exitCode = system((std::string("curl -s ") + 
        std::string(url) + 
        std::string(" -o ") + 
        std::string(savePath)).c_str());
    
    return (url + "#" + savePath);
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        std::cout << "You are running this application incorrectly, please launch this application in FinalTest!" << std::endl;

        abort();
    } else {
        output = update(argv[1], argv[2]);

        std::cout << output;
    }

    return 0x00000000;
}
