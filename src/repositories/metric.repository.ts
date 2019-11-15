import {DefaultKeyValueRepository, juggler} from '@loopback/repository';
import {Metric} from '../models';
import {MemcacheDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class MetricRepository extends DefaultKeyValueRepository<
  Metric
> {
  constructor(
    @inject('datasources.memcache') dataSource: MemcacheDataSource,
  ) {
    super(Metric, dataSource);
  }
}
