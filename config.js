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
  urlEnvioCorreo: "https://script.google.com/macros/s/AKfycbzid5D-JI2zKVMvJZJIRcdUEkxt4M8dNkGI6s20i3WnJ2ifBHz-TpFt18s5CStL3JrS/exec",

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
    { nombre: "JHON FABER CASTRO RODRIGUEZ", cc: "89006736" },
    { nombre: "CESAR AUGUSTO SALAZAR CARDONA", cc: "98595781" },
    { nombre: "CRISTIAN GALEANO BUITRAGO", cc: "1152200344" },
    { nombre: "SERGIO ALVAREZ", cc: "70754769" },
    { nombre: "YEISON PEÑALOZA", cc: "1147935221" },
    { nombre: "YORNIS ZALCEDO", cc: "1044989757" },
    { nombre: "DUBAN ALEXIS ARIAS BERRIO", cc: "1001242751" },
    { nombre: "ELKIN ARZUZA", cc: "1002295383" }
  ]
};
