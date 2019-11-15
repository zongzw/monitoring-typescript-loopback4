import { MonitoringApplication } from './application';
import { ApplicationConfig, instantiateClass } from '@loopback/core';
import { LongRunProcess } from './utils';

export { MonitoringApplication };

export async function main(options: ApplicationConfig = {}) {
  const app = new MonitoringApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  let lrp = await instantiateClass(LongRunProcess, app);
  lrp.start();

  return app;
}
