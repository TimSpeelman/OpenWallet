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

/**
 * Memoize a binary function. Caches the arguments and return value of a call to
 * this function. When the arguments are the same as in the previous call, it will
 * return the cached return value without invoking the function again.
 *
 * This is useful for functions that return a new object with the same contents
 * in each call, while we prefer to have the exact same object.
 */
export function memoizeBinary<I1, I2, O>(fn: (arg1: I1, arg2: I2) => O, thisArg: any): (arg1: I1, arg2: I2) => O {
    let cachedI1: I1;
    let cachedI2: I2;
    let cachedO: O;
    return (arg1: I1, arg2: I2) => {
        if (cachedI1 !== undefined && cachedI1 === arg1 &&
            cachedI2 !== undefined && cachedI2 === arg2) {
            return cachedO;
        } else {
            cachedI1 = arg1;
            cachedI2 = arg2;
            cachedO = fn.apply(thisArg, [arg1, arg2]);
            return cachedO;
        }
    };
}
