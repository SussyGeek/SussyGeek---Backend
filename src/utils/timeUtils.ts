
export const sleep = (s: number) => new Promise<void>(resolve => setTimeout(resolve, s * 1000));

export const randomSleep = async (baseScale: number, variation: number) => {
    await sleep(Math.random() * baseScale + variation);
}

export const timeUnits = {
    SECONDSFOR: {
        HalfHour: 1800,
        Hour: 3600,
        FIVEMINS: 500
    }
}