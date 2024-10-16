export function isPlainObject(obj: unknown) {
  return typeof obj === 'object'
    && obj !== null 
    && Object.getPrototypeOf(obj) === Object.prototype;
}
