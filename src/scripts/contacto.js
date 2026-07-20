/**
 * WhatsApp — número, enlaces y mensajes predefinidos.
 *
 * EXISTE PARA QUE EL NÚMERO VIVA EN UN SOLO SITIO. Lo consumen hoy tres
 * lugares: el pie, el botón flotante de escritorio y el icono dentro de la
 * barra de compra móvil. Escribir `wa.me/52…` a mano en cada uno es la misma
 * trampa que ya se cerró con el conteo de conferencias, que estaba copiado en
 * cinco sitios de cuatro archivos.
 *
 * El número de verdad está en `site.json`, no aquí: esto solo lo formatea.
 */
import site from '../data/site.json';

const contacto = site.contacto ?? {};

/** Número en crudo para `wa.me`, o null si todavía no hay. */
export const whatsapp = contacto.whatsapp ?? null;

/**
 * El mismo número en formato legible para PINTARLO («236 113 8979»).
 *
 * Va aparte y no se deriva del crudo a base de expresiones regulares: el
 * agrupado de un teléfono es una decisión de lectura, no un cálculo, y
 * cambiaría con la lada de quien lo lea.
 */
export const whatsappLegible = contacto.whatsappLegible ?? whatsapp;

/** Correo de contacto, o null. */
export const correo = contacto.correo ?? null;

/**
 * Enlace a WhatsApp con un mensaje ya escrito.
 *
 * `encodeURIComponent` y no una cadena escrita a mano: el mensaje lleva
 * acentos y comas, y escribir el `%C3%A1` a ojo es pedir que alguien lo
 * rompa al editar el texto.
 *
 * @param {string} [mensaje] Texto con el que se abre la conversación.
 * @returns {string | null} URL, o null si no hay número configurado.
 */
export function whatsappUrl(mensaje) {
  if (!whatsapp) return null;
  const numero = String(whatsapp).replace(/\D/g, '');
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return `https://wa.me/${numero}${texto}`;
}

/**
 * Los mensajes son DISTINTOS según de dónde salga el clic, y a propósito:
 * quien escribe desde el pie suele venir de buscar un dato concreto, y quien
 * pulsa el botón flotante está leyendo la página en ese momento. Saberlo
 * ahorra la primera pregunta de vuelta.
 */
export const MENSAJES = {
  pie: 'Hola, tengo una pregunta sobre la Expo Avícola Productiva del 7 de agosto',
  flotante: 'Hola, estoy viendo la página del congreso y tengo una duda',
  /*
    Descuentos: el código de promoción (SOCIO, COMUNIDAD) vive solo en
    boletos.json, para que el backend lo lea — nunca en un texto que llegue
    al HTML. Estos tres mensajes son la vía pública para conseguirlo: cada
    quien pide el suyo por WhatsApp y se lo dan a mano, así que el mensaje
    identifica el PERFIL (socio, estudiante), no el código.
  */
  descuentoSocioIPCI:
    'Hola, soy socio IPCI y quiero solicitar mi código de descuento para el congreso',
  descuentoEstudiante:
    'Hola, soy estudiante/exalumno y quiero solicitar mi código de descuento para el congreso',
  descuentoGeneral: 'Hola, quiero solicitar mi código de descuento para el congreso',
};
