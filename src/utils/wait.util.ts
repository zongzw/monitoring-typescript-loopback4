export const defaultInterval = 10; // 10 millisecs

/**
 * sleep function
 *
 * @param milliSecs: milliseconds for the sleep.
 */
export async function sleep(milliSecs: number): Promise<void> {
  await new Promise(f => setTimeout(f, milliSecs));
}
