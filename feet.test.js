const assert = require('assert');

function parseFeetInput(str) {
  if (typeof str !== 'string') return null;
  str = str.trim();
  if (str === '') return null;
  let sign = 1;
  if (str.startsWith('-')) {
    sign = -1;
    str = str.slice(1).trim();
  }
  if (str.includes(' ')) {
    const parts = str.split(' ');
    if (parts.length !== 2) return null;
    const whole = parseFloat(parts[0]);
    const frac = parseFeetInput(parts[1]);
    if (isNaN(whole) || frac === null) return null;
    return sign * (whole + frac);
  }
  if (str.includes('/')) {
    const [num, den] = str.split('/').map(Number);
    if (isNaN(num) || isNaN(den) || den === 0) return null;
    return sign * (num / den);
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : sign * num;
}

function toInches(feetStr) {
  const val = parseFeetInput(feetStr);
  return val === null ? null : val * 12;
}

function addInches(feetStr, inchVal) {
  const base = toInches(feetStr);
  return base === null ? null : base + inchVal;
}

assert.strictEqual(toInches('5'), 60);
assert.strictEqual(addInches('5', 11.375), 71.375);
assert.strictEqual(addInches('0', 11.5), 11.5);
assert.strictEqual(toInches('5.75'), 69);
assert.strictEqual(toInches('-2'), -24);

console.log('All tests passed');
