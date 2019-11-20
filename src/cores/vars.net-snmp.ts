import {AllTypes} from '../utils/vars.util';

export interface SnmpSession {
  get: Function;
  // getBulk: Function;
  tableColumns: Function;
  close: Function;
  onError: Function;
}

export type Varbind = {
  oid: string;
  type: number;
  value: AllTypes;
  // alias?: string;
  measure?: string;
  tags?: string;
  timestamp?: number;
};

export type TableItemTypes = number | Buffer | string;

export let snmp = require('net-snmp');

export type SnmpTuple = {
  target: string;
  community: string;
  version: string;
};

export type OIDWithMeta = {[key: string]: OIDMetaData};
export type OIDMetaData = OIDMetaData_OID | OIDMetaData_TABLE;

export type OIDMetaData_OID = {
  type: 'oid';
  alias: string;
  tags?: {[key: string]: string};
};

export type OIDMetaData_TABLE = {
  type: 'table';
  columns: {[key: string]: string};
  alias: string;
  tags?: {[key: string]: string};
};
