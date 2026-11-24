/** Minúsculas y sin tildes: "ingenieria" encuentra "Ingeniería". */
export const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
