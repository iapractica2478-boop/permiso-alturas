/**
 * Envío automático del Permiso de Trabajo en Alturas (PDF adjunto).
 * Pegue este código en https://script.google.com (ver LEEME.txt).
 */
var DESTINO = "auxingenieria@mymtorres.com";

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var nombre = String(d.filename || "Permiso_Alturas.pdf").replace(/[^\w.\-]/g, "_");
    var pdf = Utilities.newBlob(Utilities.base64Decode(d.pdf), "application/pdf", nombre);
    // Destinatarios escogidos en la página (máximo 5); si no llega ninguno, se usa DESTINO.
    var re = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
    var para = String(d.to || "").split(/[,;]+/).map(function (x) { return x.trim(); })
      .filter(function (x) { return re.test(x); }).slice(0, 5);
    if (!para.length) para = [DESTINO];
    var opciones = {
      to: para.join(","),
      subject: String(d.subject || "Permiso de Trabajo en Alturas").slice(0, 200),
      body: String(d.body || ""),
      attachments: [pdf],
      name: "Permisos de Trabajo en Alturas"
    };
    var de = String(d.from || "").trim();          // "De" escrito en la página
    if (re.test(de)) opciones.replyTo = de;         // las respuestas le llegan a esa persona
    MailApp.sendEmail(opciones);
    return respuesta({ ok: true });
  } catch (err) {
    return respuesta({ ok: false, error: String(err) });
  }
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Ejecute esta función una vez desde el editor para autorizar el envío de correos.
function probarEnvio() {
  MailApp.sendEmail(DESTINO, "Prueba - Permiso de Trabajo en Alturas", "Si recibe este correo, el envío automático está listo.");
}
