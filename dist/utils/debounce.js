export function debounce(fn, delay) {
    let timerId;
    const debounced = (...args) => {
        if (timerId !== undefined) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
            timerId = undefined;
            fn(...args);
        }, delay);
    };
    debounced.cancel = () => {
        if (timerId !== undefined) {
            clearTimeout(timerId);
            timerId = undefined;
        }
    };
    return debounced;
}
