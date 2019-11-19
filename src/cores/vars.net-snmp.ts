import {AllTypes} from '../utils/vars.util';

export interface SnmpSession {
  get: Function;
  getBulk: Function;
  close: Function;
  onError: Function;
}

export type Varbind = {
  oid: string;
  type: number;
  value: AllTypes;
};

export let snmp = require('net-snmp');

export type SnmpTuple = {
  target: string;
  community: string;
  version: string;
};

export type OIDMeta = {
  alias: string;
  tags?: {[key: string]: string};
};
