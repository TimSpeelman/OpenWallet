
export function timer(timeInMillis: number) {
    return new Promise((resolve) => setTimeout(resolve, timeInMillis));
}
