import {SnmpSession, Varbind, snmp} from '../vars.net-snmp';
import {AllTypes} from '../../utils/vars.util';
import {checkAndWait} from '../../utils';

export abstract class SnmpAction {
  constructor(protected session: SnmpSession) {}
  async do(oids: string[]): Promise<{[key: string]: Varbind}> {
    throw new Error('SnmpAction Should not be called here.');
  }
}

export class SnmpGet extends SnmpAction {
  async do(oids: string[]): Promise<{[key: string]: Varbind}> {
    let rlt: {[key: string]: Varbind} = {};

    this.session.get(oids, function(error: Error, varbinds: Varbind[]) {
      if (error) {
        console.error(error);
        rlt['error'] = {
          oid: '',
          value: error.message,
          type: -1,
        };
      } else {
        let temprlt: {[key: string]: Varbind} = {};
        for (var i = 0; i < varbinds.length; i++) {
          if (snmp.isVarbindError(varbinds[i])) {
            console.error(snmp.varbindError(varbinds[i]));
            temprlt[varbinds[i].oid] = snmp.varbindError(varbinds[i]);
          } else {
            console.log('Get ' + varbinds[i].oid + ' = ' + varbinds[i].value);
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

class SnmpGetNext extends SnmpAction {
  async do(oids: string[]): Promise<{[key: string]: Varbind}> {
    return {};
  }
}

class SnmpTable {}
class SnmpTableColumns {}
class SnmpSubtree {}

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
