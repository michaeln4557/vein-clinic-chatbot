@echo off
set PATH=%PATH%;C:\Program Files\nodejs
cd /d "%~dp0.."
node node_modules/vite/bin/vite.js --config packages/chat-widget/vite.config.ts --port 3102
