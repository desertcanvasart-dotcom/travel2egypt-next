/**
 * Tiny assertion helpers — matches the style of scripts/wp-import/__tests__/.
 * Each test module owns its own counters and prints a summary on import.
 */

export function makeAsserter(label: string) {
  let pass = 0;
  let fail = 0;
  const ok = (cond: unknown, msg: string): void => {
    if (cond) pass++;
    else {
      fail++;
      process.stderr.write(`[${label}] ✗ ${msg}\n`);
    }
  };
  const eq = <T>(actual: T, expected: T, msg: string): void => {
    if (JSON.stringify(actual) === JSON.stringify(expected)) pass++;
    else {
      fail++;
      process.stderr.write(
        `[${label}] ✗ ${msg}\n  actual:   ${JSON.stringify(actual)}\n  expected: ${JSON.stringify(expected)}\n`
      );
    }
  };
  const done = (): boolean => {
    process.stdout.write(`[${label}] ${pass} passed, ${fail} failed\n`);
    return fail === 0;
  };
  return { ok, eq, done };
}
