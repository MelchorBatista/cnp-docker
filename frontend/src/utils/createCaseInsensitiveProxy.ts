/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// utils/createCaseInsensitiveProxy.ts
export function createCaseInsensitiveProxy<T extends object>(obj: T): T {
  const wrap = (value: any): any => {
    if (Array.isArray(value)) {
      // Proxificamos cada elemento del array
      return value.map(wrap);
    }
    if (value !== null && typeof value === "object") {
      return new Proxy(value, handler);
    }
    return value; // primitivos
  };

  const handler: ProxyHandler<any> = {
    get(target, prop: string | symbol, receiver) {
      if (typeof prop === "string") {
        const realKey = Reflect.ownKeys(target).find(
          (k) => typeof k === "string" && k.toLowerCase() === prop.toLowerCase()
        );
        if (realKey !== undefined) {
          return wrap(Reflect.get(target, realKey, receiver));
        }
      }
      return wrap(Reflect.get(target, prop, receiver));
    },
    has(target, prop: string | symbol) {
      if (typeof prop === "string") {
        return Reflect.ownKeys(target).some(
          (k) => typeof k === "string" && k.toLowerCase() === prop.toLowerCase()
        );
      }
      return Reflect.has(target, prop);
    },
  };

  return wrap(obj);
}
