import {Entity, model, property} from '@loopback/repository';
import {AllTypes} from '../utils/vars.util';

@model()
export class Metric extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'number',
    required: true,
  })
  value: number;

  @property({
    type: 'string',
    required: true,
  })
  target: string;

  @property({
    type: 'string',
  })
  tags?: string;

  @property({
    type: 'number',
    required: true,
  })
  timestamp: number;

  constructor(data?: Partial<Metric>) {
    super(data);
  }
}

export interface MetricRelations {
  // describe navigational properties here
}

export type MetricWithRelations = Metric & MetricRelations;
