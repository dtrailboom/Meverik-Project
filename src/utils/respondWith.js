const xml2js = require('xml2js');
const builder = new xml2js.Builder();

/**
 * Sendet die Antwort als JSON oder XML — je nach Anfrage.
 * XML wird gewählt wenn:
 *   - ?format=xml Query-Parameter gesetzt, ODER
 *   - Accept-Header enthält application/xml aber NICHT text/html
 *     (text/html = Browser → Default JSON; reiner application/xml = API-Client → XML)
 * Standard ist immer JSON.
 *
 * @param {Object} req       - Express Request
 * @param {Object} res       - Express Response
 * @param {*}      jsonData  - Payload für res.json()
 * @param {*}      xmlData   - Objekt innerhalb von <rootTag>…</rootTag>
 * @param {string} rootTag   - XML-Wurzel-Element (z.B. 'tickets')
 *
 * Mapping: C2 (JSON + XML), M5 (JSON-Responses)
 */
function respondWith(req, res, jsonData, xmlData, rootTag = 'response') {
  const acceptHeader = req.headers['accept'] || '';

  const wantsXml =
    req.query.format === 'xml' ||
    (acceptHeader.includes('application/xml') && !acceptHeader.includes('text/html'));

  if (wantsXml) {
    const xml = builder.buildObject({ [rootTag]: xmlData });
    res.type('application/xml');
    return res.send(xml);
  }

  return res.json(jsonData);
}

module.exports = { respondWith };
