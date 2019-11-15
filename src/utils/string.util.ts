import { Metric } from "../models";

export function influxData(m: Metric) {
  return `${m.target},${m.tags} value=${m.value} ${m.timestamp}`;
}
