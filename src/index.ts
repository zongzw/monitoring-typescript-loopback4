import {MonitoringApplication} from './application';
import {ApplicationConfig, instantiateClass} from '@loopback/core';
import {LongRunProcesses, sleep} from './utils';
import {GlobalVars} from './utils/vars.util';
import {MetricsForwarder} from './cores/forwarder';

export {MonitoringApplication};

export async function main(options: ApplicationConfig = {}) {
  const app = new MonitoringApplication(options);
  await app.boot();
  await app.start();

  GlobalVars.globalApp = app;

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  let lrp = await instantiateClass(LongRunProcesses, app);
  let mc = await instantiateClass(
    MetricsForwarder,
    GlobalVars.globalApp,
    undefined,
    [1000, 'Test LRP'],
  );
  lrp.register(mc);

  GlobalVars.longRunProcs = lrp;
  // sleep(30000).then(() => lrp.unregister(mc));

  return app;
}
