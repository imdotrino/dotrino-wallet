// El id de cada cosa guardada. Sin repliegue: la app se sirve por HTTPS, donde
// `crypto.randomUUID` existe siempre; si faltara, que falle a la vista.
export const newId = () => crypto.randomUUID()
