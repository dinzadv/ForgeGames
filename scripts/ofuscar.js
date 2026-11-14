#!/usr/bin/env node
/* =====================================================
   ForgeGames — generador de configuración ofuscada
   Uso:  node scripts/ofuscar.js <PROJECT_ID> <PUBLISHABLE_KEY>
   Imprime los bloques que van en js/db.js (variable _C).

   OJO: esto es ofuscación (oculta los datos a simple vista y a
   los buscadores de secretos), NO cifrado. La seguridad real de
   la base de datos la dan las políticas RLS del SQL.
   ===================================================== */
'use strict';

const SAL = [0x5a, 0x13, 0xc7, 0x2e, 0x91, 0x6d, 0x08, 0xf4];
const ORDEN = [2, 0, 3, 1]; // orden en que se guardan los trozos

function codificar(texto) {
    const b = Buffer.from(texto, 'utf8');
    const x = Buffer.alloc(b.length);
    for (let i = 0; i < b.length; i++) x[i] = b[i] ^ SAL[i % SAL.length] ^ ((i * 31 + 7) & 255);
    return x.toString('base64').split('').reverse().join('');
}

function partir(cadena) {
    const n = Math.ceil(cadena.length / 4);
    const trozos = [0, 1, 2, 3].map(i => cadena.slice(i * n, (i + 1) * n));
    return ORDEN.map(i => trozos[i]); // guardado "desordenado"
}

function decodificar(partes) {
    const t = [];
    ORDEN.forEach((posReal, idx) => { t[posReal] = partes[idx]; });
    const b = Buffer.from(t.join('').split('').reverse().join(''), 'base64');
    const x = Buffer.alloc(b.length);
    for (let i = 0; i < b.length; i++) x[i] = b[i] ^ SAL[i % SAL.length] ^ ((i * 31 + 7) & 255);
    return x.toString('utf8');
}

if (require.main === module) {
    const [id, clave] = process.argv.slice(2);
    if (!id || !clave) {
        console.error('Uso: node scripts/ofuscar.js <PROJECT_ID> <PUBLISHABLE_KEY>');
        process.exit(1);
    }
    if (/^sb_secret_|service_role/i.test(clave)) {
        console.error('¡Esa es una clave SECRETA! Nunca la pongas en el frontend. Usa la publishable (sb_publishable_...).');
        process.exit(1);
    }
    const url = 'https://' + id.trim() + '.supabase.co';
    const u = partir(codificar(url));
    const k = partir(codificar(clave.trim()));
    if (decodificar(u) !== url || decodificar(k) !== clave.trim()) throw new Error('Fallo de verificación');
    console.log('var _C = {');
    console.log('    u: ' + JSON.stringify(u) + ',');
    console.log('    k: ' + JSON.stringify(k));
    console.log('};');
}

module.exports = { codificar, partir, decodificar };
