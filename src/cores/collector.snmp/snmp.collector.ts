import {GlobalVars, AllTypes} from '../../utils/vars.util';
import {SnmpSession, snmp, SnmpTuple, OIDMeta, Varbind} from '../vars.net-snmp';
import {Constructor, instantiateClass} from '@loopback/core';
import {MetricsCollector} from '../collector.base';
import {repository} from '@loopback/repository';
import {MetricRepository} from '../../repositories';
import {SnmpAction} from './snmp.actions';
import uuid = require('uuid');

export class SnmpCollectorFactory {
  private session: SnmpSession;
  private snmpTuple: SnmpTuple;
  private static _instance: {[key: string]: SnmpCollectorFactory} = {};

  private constructor(snmpTuple: SnmpTuple) {
    let fid = SnmpCollectorFactory.factoryId(snmpTuple);

    this.snmpTuple = snmpTuple;
    let createSession = () => {
      let v = ((vs: string) => {
        switch (vs) {
          case '1':
            return 0;
          case '2c':
            return 1;
          default:
            throw new Error(`not supported: ${vs}`);
        }
      })(snmpTuple.version);
      this.session = snmp.createSession(snmpTuple.target, snmpTuple.community, {
        version: v,
      });
    };
    createSession();
    this.session.onError = function(error: Error) {
      console.error(`${fid} closed, try to reopen.`);
      createSession();
    };
  }

  public static getInstance(snmpTuple: SnmpTuple) {
    let fid = this.factoryId(snmpTuple);
    if (!SnmpCollectorFactory._instance[fid])
      SnmpCollectorFactory._instance[fid] = new SnmpCollectorFactory(snmpTuple);
    return SnmpCollectorFactory._instance[fid];
  }

  private static factoryId(snmpTuple: SnmpTuple) {
    return `${snmpTuple.target}-${snmpTuple.community}-${snmpTuple.version}`;
  }

  public async startCollector(
    ctor: Constructor<SnmpAction>,
    oids: {[key: string]: OIDMeta},
    interval: number,
  ) {
    let sa = new ctor(this.session);
    let sc = await instantiateClass(
      SnmpCollector,
      GlobalVars.globalApp,
      undefined,
      [sa, oids, interval],
    );

    GlobalVars.longRunProcs.register(sc);
  }
}

export class SnmpCollector extends MetricsCollector {
  constructor(
    @repository(MetricRepository)
    private metricRepo: MetricRepository,
    private action: SnmpAction,
    private oids: {[key: string]: OIDMeta},
    interval: number,
  ) {
    super(interval, action.constructor.name);
  }

  async run(): Promise<void> {
    console.log(
      `SnmpCollector ${this.action.constructor.name} collecting: ${this.oids}`,
    );
    let curDateNanoSec = new Date().getTime() * 1000000;
    this.action.do(Object.keys(this.oids)).then(rlt => {
      console.log(JSON.stringify(rlt));
      let getTags = (om: OIDMeta) => {
        if (!om.tags) return '';
        let ts: string[] = [];
        for (let k of Object.keys(om.tags)) {
          ts.push(`${k}=${om.tags[k]}`);
        }
        return ts.join(',');
      };

      for (let mk of Object.keys(rlt)) {
        let id = uuid();
        let m = {
          id: id,
          target: this.oids[mk].alias,
          timestamp: curDateNanoSec,
          tags: getTags(this.oids[mk]),
          value: solveVarbindValue(rlt[mk]),
        };

        this.metricRepo.set(id, m);
      }
    });
  }
}

function solveVarbindValue(v: Varbind): number {
  switch (snmp.ObjectType[v.type]) {
    case 'Integer':
    case 'Counter':
      return <number>v.value;

    case 'OctetString':
      let s = (<Buffer>v.value).toString();
      if (s.length === 0) return -1;
      else throw new Error(`Type string is not supported, value: ${s}`);

    case 'TimeTicks':
      return <number>v.value / 100;

    default:
      throw new Error(`Not support ObjectType: ${v.type}`);
  }
}
