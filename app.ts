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

    logger.info(`> Traccar: `);
    logger.info(`> > API Token: ${config.traccar.apiToken}`);
    logger.info(`> > API Base URL: ${config.traccar.apiBaseUrl}`);
    logger.info(`> > Websocket URL: ${config.traccar.websocketUrl}`);
    logger.info(`> > Device UID: ${config.traccar.deviceUniqueId}`);
    logger.info(`> > Fetch Interval: ${config.traccar.fetchInterval}`);

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
