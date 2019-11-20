import {
  SnmpSession,
  Varbind,
  snmp,
  TableItemTypes,
  OIDWithMeta,
  OIDMetaData,
  OIDMetaData_TABLE,
} from '../vars.net-snmp';
import {AllTypes} from '../../utils/vars.util';
import {checkAndWait} from '../../utils';

export abstract class SnmpAction {
  constructor(protected session: SnmpSession) {}
  async do(oids: OIDWithMeta): Promise<{[key: string]: Varbind}> {
    throw new Error('SnmpAction Should not be called here.');
  }
}

export class SnmpGet extends SnmpAction {
  async do(oids: OIDWithMeta): Promise<{[key: string]: Varbind}> {
    let rlt: {[key: string]: Varbind} = {};

    this.session.get(Object.keys(oids), function(
      error: Error,
      varbinds: Varbind[],
    ) {
      if (error) {
        console.error(error);
        rlt['error'] = {
          oid: '',
          value: error.message,
          type: -1,
        };
      } else {
        let temprlt: {[key: string]: Varbind} = {};
        let getTags = (om: OIDMetaData) => {
          let ts: string[] = [];
          ts.push(`alias=${om.alias}`);
          if (!om.tags) return ts.join(',');

          for (let k of Object.keys(om.tags)) {
            ts.push(`${k}=${om.tags[k]}`);
          }
          return ts.join(',');
        };
        let curDateNanoSec = new Date().getTime() * 1000000;
        for (var i = 0; i < varbinds.length; i++) {
          if (snmp.isVarbindError(varbinds[i])) {
            console.error(snmp.varbindError(varbinds[i]));
            temprlt[varbinds[i].oid] = snmp.varbindError(varbinds[i]);
          } else {
            console.log('Get ' + varbinds[i].oid + ' = ' + varbinds[i].value);
            let oid = varbinds[i].oid;
            varbinds[i].measure = oids[oid].alias;
            varbinds[i].tags = getTags(oids[oid]);
            varbinds[i].timestamp = curDateNanoSec;
            temprlt[varbinds[i].oid] = varbinds[i];
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

export class SnmpTableColumns extends SnmpAction {
  async do(oids: OIDWithMeta): Promise<{[key: string]: Varbind}> {
    let rlt: {[key: string]: Varbind} = {};

    if (Object.keys(oids).length !== 1)
      throw new Error(`${oids}'s length: ${oids.length}, only 1 is permitted.`);

    let oidk = Object.keys(oids)[0];
    let oidm = <OIDMetaData_TABLE>oids[oidk];
    let columns = oidm.columns;
    if (!columns) throw new Error('No columns provided.');

    let csn = Object.keys(columns).map(v => Number(v));
    this.session.tableColumns(Object.keys(oids)[0], csn, function(
      error: Error,
      table: {[key: string]: {[key: string]: TableItemTypes}},
    ) {
      if (error) {
        console.error(error);
        rlt['error'] = {
          oid: '',
          value: error.message,
          type: -1,
        };
      } else {
        let temprlt: {[key: string]: Varbind} = {};

        let resolveTableItemType = (value: TableItemTypes): number => {
          let t = value.constructor.name;
          switch (t) {
            case 'Number':
              return 2; // Integer or 65 Counter
            case 'Buffer':
              return 4; // OctetString
            case 'String':
              return 4; // OctetString
            default:
              throw new Error(
                `cannot determine type of value: ${value}, type: ${t}`,
              );
          }
        };
        let curDateNanoSec = new Date().getTime() * 1000000;
        let getTags = (om: OIDMetaData, col: string, ind: string) => {
          let ts: string[] = [];
          ts.push(`alias=${om.alias}`);
          ts.push(`column=${col}`);
          ts.push(`index=${ind}`);
          if (!om.tags) return ts.join(',');

          for (let k of Object.keys(om.tags)) {
            ts.push(`${k}=${om.tags[k]}`);
          }
          return ts.join(',');
        };
        for (let ind of Object.keys(table)) {
          for (let col of Object.keys(table[ind])) {
            let oid = [oidk, col, ind].join('.');
            temprlt[oid] = {
              oid: oid,
              type: resolveTableItemType(table[ind][col]),
              value: table[ind][col],
              measure: oidm.alias,
              timestamp: curDateNanoSec,
              tags: getTags(oidm, col, ind),
            };
          }
        }
        rlt = temprlt;
      }
    });

    return checkAndWait(
      () => Promise.resolve(Object.keys(rlt).length > 0),
      200 * 30,
      5,
    ).then(() => {
      if (rlt['error']) throw new Error(JSON.stringify(rlt.error));
      else return rlt;
    });
  }
}

// class SnmpGetNext extends SnmpAction { }
// class SnmpTable extends SnmpAction { }
// class SnmpSubtree extends SnmpAction { }

// export class SnmpGetBulk extends SnmpAction {
//   async do(oids: string[]): Promise<{ [key: string]: Varbind }> {
//     let rlt: { [key: string]: Varbind } = {};

//     this.session.getBulk(oids, 0, 500, function (error: Error, varbinds: Varbind[]) {
//       if (error) {
//         console.error(error);
//         rlt['error'] = {
//           oid: '',
//           value: error.message,
//           type: -1,
//         };
//       } else {
//         let temprlt: { [key: string]: Varbind } = {};
//         for (var i = 0; i < varbinds.length; i++) {
//           if (snmp.isVarbindError(varbinds[i])) {
//             console.error(snmp.varbindError(varbinds[i]));
//             temprlt[varbinds[i].oid] = snmp.varbindError(varbinds[i]);
//           } else {
//             console.log('Get ' + varbinds[i].oid + ' = ' + varbinds[i].value);
//             temprlt[varbinds[i].oid] = varbinds[i];
//           }
//         }
//         rlt = temprlt;
//       }
//     });

//     return checkAndWait(
//       () => Promise.resolve(Object.keys(rlt).length > 0),
//       200,
//       5,
//     ).then(() => {
//       if (rlt['error']) throw new Error(JSON.stringify(rlt.error));
//       else return rlt;
//     });
//   }
// }
