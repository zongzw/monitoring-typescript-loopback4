import {PeriodicalTask, checkAndWait, LongRunProcesses} from '../utils';
import {AllTypes, GlobalVars} from '../utils/vars.util';
import {Varbind, SnmpSession} from './vars.net-snmp';
import {Constructor} from '@loopback/core';

let snmp = require('net-snmp');

export class MetricsCollector extends PeriodicalTask {}

abstract class SnmpAction {
  constructor(protected session: SnmpSession) {}
  async do(oids: string[]): Promise<object> {
    throw new Error('SnmpAction Should not be called here.');
  }
}

export class SnmpGet extends SnmpAction {
  async do(oids: string[]): Promise<object> {
    let rlt: {[key: string]: AllTypes} = {};

    this.session.get(oids, function(error: Error, varbinds: Varbind[]) {
      if (error) {
        console.error(error);
        rlt['error'] = error;
      } else {
        let temprlt: {[key: string]: AllTypes} = {};
        for (var i = 0; i < varbinds.length; i++) {
          if (snmp.isVarbindError(varbinds[i])) {
            console.error(snmp.varbindError(varbinds[i]));
            temprlt[varbinds[i].oid] = snmp.varbindError(varbinds[i]);
          } else {
            console.log('Get ' + varbinds[i].oid + ' = ' + varbinds[i].value);
            temprlt[varbinds[i].oid] = varbinds[i].value;
          }
        }
        rlt = temprlt;
      }
    });

    return checkAndWait(
      () => Promise.resolve(Object.keys(rlt).length > 0),
      200,
      5,
    ).then(() => {
      if (rlt['error']) throw new Error(JSON.stringify(rlt.error));
      else return rlt;
    });
  }
}

class SnmpGetNext extends SnmpAction {
  async do(oids: string[]): Promise<object> {
    return {};
  }
}

class SnmpGetBulk extends SnmpAction {
  async do(oids: string[]): Promise<object> {
    return {};
  }
}

type SnmpTuple = {
  target: string;
  community: string;
  version: string;
};

export class SnmpFactory {
  private session: SnmpSession;
  private snmpTuple: SnmpTuple;
  private static _instance: {[key: string]: SnmpFactory} = {};

  private constructor(snmpTuple: SnmpTuple) {
    let fid = SnmpFactory.factoryId(snmpTuple);

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
    if (!SnmpFactory._instance[fid])
      SnmpFactory._instance[fid] = new SnmpFactory(snmpTuple);
    return SnmpFactory._instance[fid];
  }

  private static factoryId(snmpTuple: SnmpTuple) {
    return `${snmpTuple.target}-${snmpTuple.community}-${snmpTuple.version}`;
  }

  public startCollector(
    ctor: Constructor<SnmpAction>,
    oids: string[],
    interval: number,
  ) {
    let sa = new ctor(this.session);
    let sc = new SnmpCollector(sa, oids, interval);

    GlobalVars.longRunProcs.register(sc);
  }
}

class SnmpCollector extends MetricsCollector {
  constructor(
    private action: SnmpAction,
    private oids: string[],
    interval: number,
  ) {
    super(interval, action.constructor.name);
  }

  async run(): Promise<void> {
    console.log(
      `SnmpCollector ${this.action.constructor.name} collecting: ${this.oids}`,
    );
    this.action.do(this.oids).then(rlt => {
      console.log(JSON.stringify(rlt));
    });
  }
}
