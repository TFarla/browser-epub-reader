export const makeStore = ({ subscribe, content }) => {
    const handler = {
        get: function (target, prop, receiver) {
            return target[prop];
        },
        set: function (obj, prop, value) {
            subscribe(obj, prop, value);
            obj[prop] = value;
            return true;
        }
    }

    const store = new Proxy(content, handler);
    return store;
};
