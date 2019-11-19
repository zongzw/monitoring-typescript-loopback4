import {inject} from '@loopback/core';
import {
  RestBindings,
  post,
  RequestContext,
  param,
  requestBody,
  HttpErrors,
  get,
} from '@loopback/rest';
import {MetricRepository} from '../repositories';
import uuid = require('uuid');
import {repository} from '@loopback/repository';
import {fmtInfluxData} from '../cores/forwarder';
import {AllTypes} from '../utils/vars.util';
import {SnmpCollectorFactory} from '../cores/collector.snmp/snmp.collector';
import {SnmpGet, SnmpGetBulk} from '../cores/collector.snmp/snmp.actions';
import {OIDMeta} from '../cores/vars.net-snmp';

type MetricData = {
  value: number;
  timestampNanoSec: number;
};

export class MetricsController {
  constructor(
    @inject(RestBindings.Http.CONTEXT)
    private reqCxt: RequestContext,
    @repository(MetricRepository)
    private metricRepo: MetricRepository,
  ) {}

  // post http://localhost:3000/metrics/cpuusage?type=user&host=compute-0
  @post('/metrics/{target}')
  postMetrics(
    @param.path.string('target') target: string,
    @requestBody() body: MetricData,
  ): string {
    if (!body.value) throw new HttpErrors.BadRequest('value cannot be null');
    if (!body.timestampNanoSec || body.timestampNanoSec.toString().length != 19)
      body.timestampNanoSec = new Date().getTime() * 1000000;

    let queries = this.reqCxt.request.query;
    let qs: string[] = [];
    for (let k in queries) {
      qs.push(`${k}=${queries[k]}`);
    }

    let id = uuid();
    this.metricRepo.set(id, {
      id: id,
      target: target,
      tags: qs.join(','),
      value: body.value,
      timestamp: body.timestampNanoSec,
    });
    return `${id}: OK`;
  }

  @get('/metrics')
  async getMetrics(): Promise<string[]> {
    let rlt: string[] = [];
    for await (let k of this.metricRepo.keys()) {
      await this.metricRepo.get(k).then(m => {
        rlt.push(fmtInfluxData(m));
      });
    }

    return rlt;
  }

  @get('/snmp/get')
  async snmpGet(
    @param.query.string('hostname')
    hostname: string,
    @param.query.string('community')
    community: string,
    @param.query.string('oid')
    oid: string,
  ): Promise<object> {
    let rlt: {[key: string]: AllTypes} = {};

    let snmp = require('net-snmp');
    let session = snmp.createSession(hostname, community);
    let sa = new SnmpGet(session);
    return sa.do([oid]).then(rlt => {
      session.close();
      return rlt;
    });
  }

  @get('/snmp/getbulk')
  async snmpGetBulk(
    @param.query.string('hostname')
    hostname: string,
    @param.query.string('community')
    community: string,
    @param.query.string('oid')
    oid: string,
  ): Promise<object> {
    let rlt: {[key: string]: AllTypes} = {};

    let snmp = require('net-snmp');
    let session = snmp.createSession(hostname, community);
    let sa = new SnmpGetBulk(session);
    return sa.do([oid]).then(rlt => {
      session.close();
      return rlt;
    });
  }

  @post('/collectors/snmpget')
  async addCollectors(
    @requestBody()
    body: {
      target: string;
      community: string;
      version: string;
      interval: number;
      oids: {[key: string]: OIDMeta};
    },
  ) {
    let sf = SnmpCollectorFactory.getInstance({
      target: body.target,
      community: body.community,
      version: body.version,
    });

    sf.startCollector(SnmpGet, body.oids, body.interval);
  }
}
