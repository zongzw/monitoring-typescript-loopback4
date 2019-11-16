import { repository } from "@loopback/repository";
import { MetricRepository } from "../repositories";
import { sleep } from "./wait.util";
import { influxData } from "./string.util";
import { inject, instantiateClass } from "@loopback/core";
import { RestService } from "../services";
import { GlobalVars } from "./vars.util";

export class LongRunProcesses {
  private collectors: MetricsCollector[];
  constructor() { }

  async start(): Promise<void> {

    let mc = await instantiateClass(MetricsCollector, GlobalVars.globalApp, undefined, [10]);
    while (true) {
      await sleep(10).then(() => mc.collectFromMemcache());
    }

  }

  async register(collector: MetricsCollector): Promise<void> {
    this.collectors.push(collector);
  }
}

class PeriodicalTask {
  constructor(intervalInMillSec: number) { }
  run() { }
}

class MetricsCollector extends PeriodicalTask {
  constructor(
    @repository(MetricRepository)
    private metricRepo: MetricRepository,
    @inject('services.RestService')
    private restService: RestService,
    intervalInMillSec: number
  ) {
    super(intervalInMillSec);
  }

  async collectFromMemcache() {
    let metrics: string[] = [];

    for await (let k of this.metricRepo.keys()) {
      await this.metricRepo.get(k)
        .then(async m => {
          metrics.push(influxData(m));
          return k;
        })
        .then(k => this.metricRepo.delete(k))
        .catch(e => console.error(e));
    }

    let s = metrics.join('\n');
    if (s === '') return;

    await this.restService
      .doRest(
        'POST',
        `${process.env.INFLUXDB_URL!}/write?db=mydb`,
        {
          "Content-Type": "application/octet-stream",
          "Content-Range": `0-${s.length - 1}/${s.length}`,
        },
        Buffer.from(s)
      )
      .catch(e => console.error(e));
  }

  async collectFromSnmp() {

  }
}
