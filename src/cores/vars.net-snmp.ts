export interface SnmpSession {
  get: Function;
  close: Function;
  onError: Function;
}

export type Varbind = {
  oid: string;
  type: number;
  value: object | number | string | boolean | undefined;
};
