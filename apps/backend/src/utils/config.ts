export const config = {
    PORT: process.env.PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET || 'secret-key',
};

export let dbAvailable = true;

export function setDbAvailable(available: boolean) {
    dbAvailable = available;
}
