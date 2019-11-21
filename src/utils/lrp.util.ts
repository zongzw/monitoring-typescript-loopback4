import uuid = require('uuid');

export class LongRunProcesses {
  private procDict: {[key: string]: object} = {};
  constructor() {}

  async register(task: PeriodicalTask): Promise<void> {
    this.procDict[task.id] = {
      class: task.constructor.name,
      name: task.name,
      interval: task.intervalInMillSec,
      task: task.taskMeta(),
    };

    let tmIntvl = task.intervalInMillSec;
    let loopFunc = async () => {
      if (!Object.keys(this.procDict).includes(task.id)) return;
      return task
        .run()
        .then(() => setTimeout(loopFunc, tmIntvl))
        .catch(e => {
          console.log(`collector run error: ${JSON.stringify(e)}`);
          setTimeout(loopFunc, tmIntvl);
        });
    };
    loopFunc();
  }

  async unregister(collector: PeriodicalTask) {
    delete this.procDict[collector.id];
  }

  processes(): object {
    return this.procDict;
  }
}

export abstract class PeriodicalTask {
  private runTimes = 0;
  public id = uuid();
  // public description: string;
  constructor(public intervalInMillSec: number, public name: string) {}

  run(): Promise<void> {
    throw new Error(`${this.constructor.name}'s run should not be called.`);
  }

  taskMeta(): object {
    throw new Error(
      `${this.constructor.name}'s taskMeta should not be called.`,
    );
  }
}
