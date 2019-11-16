import { MonitoringApplication } from './application';
import { ApplicationConfig, instantiateClass } from '@loopback/core';
import { LongRunProcesses } from './utils';
import { GlobalVars } from './utils/vars.util';

export { MonitoringApplication };

export async function main(options: ApplicationConfig = {}) {
  const app = new MonitoringApplication(options);
  await app.boot();
  await app.start();

  GlobalVars.globalApp = app;

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  let lrp = await instantiateClass(LongRunProcesses, app);
  lrp.start();

  return app;
}
