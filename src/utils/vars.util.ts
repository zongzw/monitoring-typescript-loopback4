import {MonitoringApplication} from '..';
import {LongRunProcesses} from './lrp.util';

export type AllTypes = string | number | boolean | undefined | object;

export class GlobalVars {
  static globalApp: MonitoringApplication;
  static longRunProcs: LongRunProcesses;
}
