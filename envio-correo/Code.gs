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
    MailApp.sendEmail({
      to: DESTINO,                       // siempre a este correo (no se puede cambiar desde la página)
      subject: String(d.subject || "Permiso de Trabajo en Alturas").slice(0, 200),
      body: String(d.body || ""),
      attachments: [pdf],
      name: "Permisos de Trabajo en Alturas"
    });
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
