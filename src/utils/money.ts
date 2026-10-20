export const money = (value: number) => `Q${value.toLocaleString('es-GT', { maximumFractionDigits: 2 })}`
