import {PeriodicalTask} from '../utils/lrp.util';
import {repository} from '@loopback/repository';
import {MetricRepository} from '../repositories';
import {inject} from '@loopback/core';
import {RestService} from '../services';
import {Metric} from '../models';

export function fmtInfluxData(m: Metric) {
  let tt: string = `${m.target},${m.tags}`;
  if (!m.tags || m.tags === '') tt = m.target;

  return `${tt} value=${m.value} ${m.timestamp}`;
}

export class MetricsForwarder extends PeriodicalTask {
  constructor(
    @repository(MetricRepository)
    private metricRepo: MetricRepository,
    @inject('services.RestService')
    private restService: RestService,
    intervalInMillSec: number,
    name: string,
  ) {
    super(intervalInMillSec, name);
  }

  async run() {
    let metrics: string[] = [];

    for await (let k of this.metricRepo.keys()) {
      await this.metricRepo
        .get(k)
        .then(async m => {
          metrics.push(fmtInfluxData(m));
          return k;
        })
        .then(k => this.metricRepo.delete(k))
        .catch(e => console.error(e));
    }

    // console.log(`length of metrics: ${metrics.length}`);
    if (metrics.length > 0) {
      let s = metrics.join('\n');
      await this.restService
        .doRest(
          'POST',
          `${process.env.INFLUXDB_URL!}/write?db=mydb`,
          {
            'Content-Type': 'application/octet-stream',
            'Content-Range': `0-${s.length - 1}/${s.length}`,
          },
          Buffer.from(s),
        )
        .catch(e => console.error(e));
    }
  }
}
