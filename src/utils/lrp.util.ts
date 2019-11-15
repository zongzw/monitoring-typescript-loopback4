import { repository } from "@loopback/repository";
import { MetricRepository } from "../repositories";
import { sleep } from "./wait.util";
import { influxData } from "./string.util";
import { inject } from "@loopback/core";
import { RestService } from "../services";

export class LongRunProcess {
  constructor(
    @repository(MetricRepository)
    private repo: MetricRepository,
    @inject('services.RestService')
    private restService: RestService,
  ) { }

  async start(): Promise<void> {
    while (true) {
      await sleep(Math.floor(Math.random() * 1000));
      let ks = this.repo.keys();
      for await (let k of ks) {
        await this.repo.get(k)
          .then(async m => {
            let s = influxData(m);
            console.log(`consume ${k} ${s}`);
            await this.restService.doRest(
              'POST',
              `${process.env.INFLUXDB_URL!}/write?db=mydb`,
              {
                "Content-Type": "application/octet-stream",
                "Content-Range": `0-${s.length - 1}/${s.length}`,
              },
              Buffer.from(s)
            )
            return k;
          })
          .then(k => this.repo.delete(k))
          .catch(e => console.error(e));
      }
    }
  }
}
