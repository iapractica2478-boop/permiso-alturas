// ===== CONFIGURACIÓN DEL FORMULARIO =====
// Puede editar este archivo con el Bloc de notas.

window.TSA_CONFIG = {
  // Correo principal que recibe los permisos
  correoDestino: "auxingenieria@mymtorres.com",

  // Correos que aparecen en la lista "Enviar a" (el primero sale escogido).
  // También se puede escribir otro correo y agregar copias al enviar.
  correosDestino: [
    "auxingenieria@mymtorres.com"
  ],

  // Por dónde sale el correo cuando no hay envío automático:
  //   "gmail"  -> abre Gmail (mail.google.com) con destinatario, asunto y texto listos
  //   "mailto" -> abre la aplicación de correo predeterminada del equipo
  salidaCorreo: "gmail",

  // URL del Google Apps Script que envía el correo con el PDF adjunto
  // (ver LEEME.txt, paso "Envío automático"). Si se deja vacío, el botón
  // "Enviar correo" abre la aplicación de correo / compartir del equipo.
  urlEnvioCorreo: "",

  // Ciudades de la lista desplegable ("Otra" permite escribir una nueva)
  ciudades: [
    "Bogotá D.C.", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga",
    "Cúcuta", "Pereira", "Manizales", "Armenia", "Ibagué", "Villavicencio",
    "Santa Marta", "Neiva", "Pasto", "Tunja", "Montería", "Valledupar",
    "Popayán", "Sincelejo", "Yopal", "Riohacha", "Quibdó", "Florencia",
    "Girardot", "Fusagasugá", "Zipaquirá", "Soacha", "Chía", "Facatativá"
  ],

  // Respaldo del listado de personal. La página lee primero el archivo
  // LISTADO_PERSONAL.xlsx (columnas NOMBRE COMPLETO y CC). Esta lista solo
  // se usa si ese archivo no se puede leer.
  personal: [
    { nombre: "JHON FABER CASTRO RODRIGUEZ", cc: "89006736" }
  ]
};
