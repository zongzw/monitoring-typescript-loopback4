import { PeriodicalTask } from "../utils";

export class MetricsCollector extends PeriodicalTask {

}

class SnmpAction {
  do(session: string, mid: string) { }
}

class SnmpGet extends SnmpAction {
  do() { }
}

class SnmpGetNext extends SnmpAction {
  do() { }
}

class SnmpGetBulk extends SnmpAction {
  do(session: string, mid: string) { }
}

export class SnmpCollector extends MetricsCollector {
  constructor(
    private ipAddress: string,
    private community: string,
    private interval: number,
    private action: SnmpAction,
    private mibId: string,
  ) {
    super(interval, 'name');
  }
}

