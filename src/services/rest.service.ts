import {getService} from '@loopback/service-proxy';
import {inject, Provider} from '@loopback/core';
import {RestapiDataSource} from '../datasources';

export interface RestService {
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

export class RestServiceProvider implements Provider<RestService> {
  constructor(
    // restapi must match the name property in the datasource json file
    @inject('datasources.restapi')
    protected dataSource: RestapiDataSource = new RestapiDataSource(),
  ) {}

  value(): Promise<RestService> {
    return getService(this.dataSource);
  }
}
