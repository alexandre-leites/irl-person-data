import * as fs from 'fs';

import logger from './src/utils/logger';
import config from './config';
import ServerManager from './src/httpserver/serverManager';

function displayLogo() {
    if (config.application.hideLogo)
        return;

    try {
        const logo = fs.readFileSync('./logo.txt', 'utf8');
        console.log(logo);
        console.log();
    } catch (error) {
        // ignore
    }
}

function displayConfig() {
    logger.info("Configuration: ");

    logger.info(`> Application: `);
    logger.info(`> > Log Level: ${config.application.logLevel}`);
    logger.info(`> > Hide Logo: ${config.application.hideLogo}`);

    logger.info(`> Web Server: `);
    logger.info(`> > Port: ${config.webServer.port}`);
    logger.info(`> > HTTP Path: ${config.webServer.httpPath}`);
    logger.info(`> > WebSocket Path: ${config.webServer.wsPath}`);

    logger.info(`> Life360: `);
    logger.info(`> > Client Token: ${config.life360.clientToken}`);
    logger.info(`> > Username: ${config.life360.username}`);
    logger.info(`> > Password: ${config.life360.password}`);
    logger.info(`> > Circle: ${config.life360.circle}`);
    logger.info(`> > Member: ${config.life360.member}`);
    logger.info(`> > Fetch Interval: ${config.life360.fetchInterval}`);

    logger.info(`> OpenWeatherMap: `);
    logger.info(`> > API Key: ${config.openweathermap.apiKey}`);
    logger.info(`> > Fetch Interval: ${config.openweathermap.fetchInterval}`);
}

displayLogo();
displayConfig();
const serverManager = new ServerManager();

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

serverManager.startServer(config.webServer.port);
