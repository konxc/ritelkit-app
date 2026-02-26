const fs = require('fs');
const path = require('path');
const directoryPath = '/home/dev/project/roti-sholawat/src/components';

function processDirectory(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.svelte')) {
            processFile(fullPath);
        }
    });
}

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    content = content.replace(/role="button" tabindex="0" on:click={([^}]+)} on:keydown={([^}]+)}/g, (match, clickHandler, keydownHandler) => {
        void match;
        return `role="button" tabindex="0" onclick={${clickHandler}} onkeydown={${keydownHandler}}`;
    });

    if (content !== originalContent) {
        console.log('Fixed on:click to onclick in:', file);
        fs.writeFileSync(file, content);
    }
}

processDirectory(directoryPath);
