import {MonitoringApplication} from './application';
import {ApplicationConfig} from '@loopback/core';

export {MonitoringApplication};

export async function main(options: ApplicationConfig = {}) {
  const app = new MonitoringApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}
