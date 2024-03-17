// GitHub URL for downloading script and config files:
// https://github.com/tsmith165/nvchad-windows-installer/raw/main

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Logger configuration
const logFile = 'debug.log';
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    logStream.write(logMessage);
    console.log(message);
}

function logError(message) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR: ${message}\n`;
    logStream.write(errorMessage);
    console.error(message);
}

// Prerequisites check
const prerequisites = [
    { name: 'Node.js', command: 'node --version', minVersion: 'v14.0.0' },
    { name: 'npm', command: 'npm --version', minVersion: '6.0.0' },
    { name: 'Git', command: 'git --version', minVersion: '2.0.0' },
];

prerequisites.forEach((prereq) => {
    try {
        const version = execSync(prereq.command, { encoding: 'utf8' }).trim();
        log(`${prereq.name} version: ${version}`);

        const currentVersion = version.replace(/^v/, '');
        const requiredVersion = prereq.minVersion.replace(/^v/, '');

        if (currentVersion < requiredVersion) {
            logError(
                `${prereq.name} version ${prereq.minVersion} or higher is required. Please update ${prereq.name} and run the script again.`
            );
            process.exit(1);
        }
    } catch (error) {
        logError(`${prereq.name} is not installed. Please install it and run the script again.`);
        process.exit(1);
    }
});

// Helper function to run shell commands
function runCommand(command) {
    try {
        execSync(command, { stdio: 'inherit' });
        log(`Command executed: ${command}`);
    } catch (error) {
        logError(`Error executing command: ${command}`);
        logError(error.message);
        process.exit(1);
    }
}

// Install NeoVim
log('Installing NeoVim...');
const nvimInstaller = 'nvim-win64.msi';
const nvimUrl = `https://github.com/neovim/neovim/releases/latest/download/${nvimInstaller}`;
runCommand(`curl -L -o ${nvimInstaller} ${nvimUrl}`);
runCommand(`msiexec /i ${nvimInstaller} /qn`);
fs.unlinkSync(nvimInstaller);
log('NeoVim installation completed.');

// Install msys2 (C++)
log('Installing msys2...');
const msys2Installer = 'msys2-x86_64-20240113.exe';
const msys2Url = `https://github.com/msys2/msys2-installer/releases/download/2024-01-13/${msys2Installer}`;
runCommand(`curl -L -o ${msys2Installer} ${msys2Url}`);
runCommand(`${msys2Installer} /S`);
fs.unlinkSync(msys2Installer);
log('msys2 installation completed.');

// Set environment variables for msys2
log('Setting environment variables for msys2...');
const envPaths = ['C:\\msys64\\usr\\bin', 'C:\\msys64\\mingw64\\bin'];
const envPath = process.env.PATH;
envPaths.forEach((path) => {
    if (!envPath.includes(path)) {
        process.env.PATH += `;${path}`;
    }
});
log('Environment variables for msys2 set.');

// Install JetBrains Mono Nerd Font
log('Installing JetBrains Mono Nerd Font...');
const fontZip = 'JetBrainsMono.zip';
const fontUrl = 'https://download.jetbrains.com/fonts/JetBrainsMono-2.242.zip';
runCommand(`curl -L -o ${fontZip} ${fontUrl}`);
runCommand(`tar -xf ${fontZip} -C ${process.env.TEMP}`);
fs.readdirSync(path.join(process.env.TEMP, 'JetBrainsMono-2.242'))
    .filter((file) => file.endsWith('.ttf'))
    .forEach((file) => {
        fs.copyFileSync(path.join(process.env.TEMP, 'JetBrainsMono-2.242', file), `C:\\Windows\\Fonts\\${file}`);
    });
fs.unlinkSync(fontZip);
fs.rmdirSync(path.join(process.env.TEMP, 'JetBrainsMono-2.242'), { recursive: true });
log('JetBrains Mono Nerd Font installation completed.');

// Install NVChad
log('Installing NVChad...');
const nvimDir = path.join(process.env.LOCALAPPDATA, 'nvim');
runCommand(`git clone -b v2.0 https://github.com/NvChad/NvChad ${nvimDir} --depth 1`);
log('NVChad installation completed.');

// Configure NVChad / LSPs
log('Configuring NVChad and LSPs...');
const configFiles = [
    { src: 'configs/chadrc.lua', dest: path.join(nvimDir, 'lua', 'custom', 'chadrc.lua') },
    { src: 'configs/plugins.lua', dest: path.join(nvimDir, 'lua', 'custom', 'plugins.lua') },
    { src: 'configs/lspconfig.lua', dest: path.join(nvimDir, 'lua', 'plugins', 'configs', 'lspconfig.lua') },
];

configFiles.forEach((file) => {
    fs.copyFileSync(file.src, file.dest);
    log(`Copied ${file.src} to ${file.dest}`);
});
log('NVChad and LSPs configuration completed.');

// Install LSPs (Python / TypeScript)
log('Installing LSPs for Python and TypeScript...');
runCommand('npm install -g pyright');
runCommand('npm install -g typescript-language-server');
log('LSPs for Python and TypeScript installed.');

log('Setup completed successfully!');
logStream.end();
