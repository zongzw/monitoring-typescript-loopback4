export const defaultInterval = 10; // 10 millisecs

/**
 * sleep function
 *
 * @param milliSecs: milliseconds for the sleep.
 */
export async function sleep(milliSecs: number): Promise<void> {
  await new Promise(f => setTimeout(f, milliSecs));
}

/**
 * Check and wait until some condition is fulfilled or timeout.
 *
 * @param checkFunc: a function which
 *   resolves true if condition is satisfied and need to quit;
 *   resolves false if condition is not satisfied and need to check again;
 *   rejects reason, which is a string, if condition failed and we quit waiting for it.
 *   Otherwise ... quit.
 * @param tryTimes: times for wait.
 * @param funcArgs: array of any.
 * @param intervalInMSecs: interval in milli-seconds for sleeping between 2 tries.
 * @return:
 *  resolve true: success quit.
 *  reject <*>: stop quit.
 *  */
export async function checkAndWait(
  checkFunc: () => Promise<boolean>,
  tryTimes: number,
  intervalInMSecs: number,
): Promise<boolean> {
  if (tryTimes <= 0) Promise.reject('timeout');

  let hdlr = async (b: boolean): Promise<boolean> => {
    return b
      ? b
      : sleep(intervalInMSecs).then(() =>
          checkAndWait(checkFunc, tryTimes - 1, intervalInMSecs),
        );
  };

  let errHdlr = async (reason: string | Error): Promise<boolean> => {
    if (reason instanceof Error) return hdlr(false);
    else return Promise.reject(reason);
  };

  return checkFunc().then(hdlr, errHdlr);
}
