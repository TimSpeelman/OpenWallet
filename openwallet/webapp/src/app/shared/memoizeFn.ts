/**
 * Memoize a unary function. Caches the argument and return value of a call to
 * this function. When the argument is the same as in the previous call, it will
 * return the cached return value without invoking the function again.
 *
 * This is useful for functions that return a new object with the same contents
 * in each call, while we prefer to have the exact same object.
 */
export function memoizeUnary<I, O>(fn: (arg: I) => O, thisArg: any): (arg: I) => O {
    let cachedI: I;
    let cachedO: O;
    return (arg: I) => {
        if (cachedI !== undefined && cachedI === arg) {
            return cachedO;
        } else {
            cachedI = arg;
            cachedO = fn.apply(thisArg, [arg]);
            return cachedO;
        }
    };
}
