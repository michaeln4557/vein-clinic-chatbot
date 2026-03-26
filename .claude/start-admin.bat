@echo off
set PATH=%PATH%;C:\Program Files\nodejs
cd /d "%~dp0..\packages\admin-ui"
node ..\..\node_modules\vite\bin\vite.js --port 3100
