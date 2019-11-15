import { getService } from '@loopback/service-proxy';
import { inject, Provider } from '@loopback/core';
import { RestapiDataSource } from '../datasources';

export interface Rest {
  // this is where you define the Node.js methods that will be
  // mapped to REST/SOAP/gRPC operations as stated in the datasource
  // json file.
  doRest(
    method: string,
    url: string,
    headers: object,
    body: object,
  ): Promise<object>;
}

export class RestProvider implements Provider<Rest> {
  constructor(
    // restapi must match the name property in the datasource json file
    @inject('datasources.restapi')
    protected dataSource: RestapiDataSource = new RestapiDataSource(),
  ) { }

  value(): Promise<Rest> {
    return getService(this.dataSource);
  }
}
