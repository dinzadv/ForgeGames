(function () {
    'use strict';

    var _C = {
        u: ["Fehg0xsRSDYhfA", "==wWKH8lZM4dcz", "pYKvj51HmO2HUN", "E1USdDG63wdp9m"],
        k: ["+B8lWKQxVppauLph", "==AS5SllcXfZ5D7s", "QsZZW3XptemOdflL", "5E7Q8zg/AW5CkGn+"]
    };
    var _SAL = [0x5a, 0x13, 0xc7, 0x2e, 0x91, 0x6d, 0x08, 0xf4];
    var _ORD = [2, 0, 3, 1];

    function _d(partes) {
        var t = [];
        _ORD.forEach(function (real, i) { t[real] = partes[i]; });
        var bin = atob(t.join('').split('').reverse().join(''));
        var out = '';
        for (var i = 0; i < bin.length; i++) {
            out += String.fromCharCode(bin.charCodeAt(i) ^ _SAL[i % _SAL.length] ^ ((i * 31 + 7) & 255));
        }
        return out;
    }

    function lsLeer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsEscribir(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
    function lsBorrar(k) { try { localStorage.removeItem(k); } catch (e) { } }

    function crearBloqueado(mensaje) {
        var resp = { data: { session: null, user: null }, error: { message: mensaje } };
        var proxy;
        var handler = {
            get: function (t, prop) {
                if (prop === 'then') return function (ok, no) { return Promise.resolve(resp).then(ok, no); };
                return proxy;
            },
            apply: function () { return proxy; }
        };
        proxy = new Proxy(function () { }, handler);
        return proxy;
    }

    if (!window.supabase || !window.supabase.createClient) {
        console.error('ForgeGames: no se pudo cargar la librería de Supabase (revisa tu conexión o bloqueadores de contenido).');
        avisar('No se pudo cargar la librería de Supabase.\nRevisa tu conexión o desactiva el bloqueador de contenido y recarga la página.');
        window.mcDB = crearBloqueado('No se pudo conectar con el servidor.');
        return;
    }

    var URL_BASE = '';
    var CLAVE = '';
    try {
        URL_BASE = _d(_C.u);
        CLAVE = _d(_C.k);
    } catch (e) { }

    function avisar(texto, color) {
        function poner() {
            var d = document.getElementById('fg-aviso');
            if (!d) {
                d = document.createElement('div');
                d.id = 'fg-aviso';
                d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:12px 16px;font:14px/1.4 sans-serif;color:#fff;white-space:pre-line;text-align:left;max-height:60vh;overflow:auto';
                document.body.appendChild(d);
            }
            d.style.background = color || '#b91c1c';
            d.textContent = texto;
        }
        if (document.body) poner(); else document.addEventListener('DOMContentLoaded', poner);
    }

    if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(URL_BASE) || CLAVE.indexOf('sb_publishable_') !== 0) {
        console.error('ForgeGames: la configuración de conexión está dañada.');
        avisar('Configuración de conexión dañada. Regenera el bloque _C con: node scripts/ofuscar.js <ID> <KEY>');
        window.mcDB = crearBloqueado('Configuración dañada.');
        return;
    }

    var cliente = window.supabase.createClient(URL_BASE, CLAVE, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            storageKey: 'fg_auth'
        }
    });

    var PREFIJO_CACHE = 'fg_c1:';
    var memoria = {};
    var enVuelo = {};

    var cache = {
        leer: function (k) {
            if (memoria[k]) return memoria[k];
            var raw = lsLeer(PREFIJO_CACHE + k);
            if (!raw) return null;
            try {
                var o = JSON.parse(raw);
                if (o && typeof o.t === 'number') { memoria[k] = o; return o; }
            } catch (e) { }
            lsBorrar(PREFIJO_CACHE + k);
            return null;
        },
        guardar: function (k, v) {
            var o = { t: Date.now(), v: v };
            memoria[k] = o;
            var txt;
            try { txt = JSON.stringify(o); } catch (e) { return; }
            if (!lsEscribir(PREFIJO_CACHE + k, txt)) {
                cache.borrar('');
                memoria[k] = o;
                lsEscribir(PREFIJO_CACHE + k, txt);
            }
        },
        borrar: function (prefijo) {
            prefijo = prefijo || '';
            Object.keys(memoria).forEach(function (k) { if (k.indexOf(prefijo) === 0) delete memoria[k]; });
            var aBorrar = [];
            try {
                for (var i = 0; i < localStorage.length; i++) {
                    var clave = localStorage.key(i);
                    if (clave && clave.indexOf(PREFIJO_CACHE + prefijo) === 0) aBorrar.push(clave);
                }
            } catch (e) { }
            aBorrar.forEach(lsBorrar);
        },
        obtener: function (k, ttlMs, pedir, forzar) {
            var e = cache.leer(k);
            if (e && !forzar && Date.now() - e.t < ttlMs) return Promise.resolve(e.v);
            if (enVuelo[k]) return enVuelo[k];
            enVuelo[k] = (async function () {
                try {
                    var v = await pedir();
                    cache.guardar(k, v);
                    return v;
                } catch (err) {
                    if (e) return e.v;
                    throw err;
                } finally {
                    delete enVuelo[k];
                }
            })();
            return enVuelo[k];
        }
    };

    var MIN = 60 * 1000;
    var TTL = { addons: 3 * MIN, usuarios: 5 * MIN, addon: 2 * MIN, perfil: 5 * MIN, ids: 10 * MIN };

    function chequear(res) {
        if (res.error) throw res.error;
        return res.data;
    }

    cliente.listarAddons = function (forzar) {
        return cache.obtener('addons', TTL.addons, async function () {
            return chequear(await cliente.from('addons').select('*').order('created_at', { ascending: false })) || [];
        }, forzar);
    };

    cliente.listarUsuarios = function (forzar) {
        return cache.obtener('usuarios', TTL.usuarios, async function () {
            return chequear(await cliente.from('users').select('*')) || [];
        }, forzar);
    };

    cliente.obtenerAddon = function (id, forzar) {
        return cache.obtener('addon:' + id, TTL.addon, async function () {
            return chequear(await cliente.from('addons').select('*').eq('id', id).maybeSingle());
        }, forzar);
    };

    cliente.addonsDeUsuario = function (userId, forzar) {
        return cache.obtener('addons_u:' + userId, TTL.addon, async function () {
            return chequear(await cliente.from('addons').select('*').eq('user_id', userId).order('created_at', { ascending: false })) || [];
        }, forzar);
    };

    cliente.obtenerPerfil = function (id, forzar) {
        return cache.obtener('perfil:' + id, TTL.perfil, async function () {
            return chequear(await cliente.from('users').select('*').eq('id', id).maybeSingle());
        }, forzar);
    };

    cliente.idsDe = function (tabla, userId, forzar) {
        return cache.obtener(tabla + ':' + userId, TTL.ids, async function () {
            var filas = chequear(await cliente.from(tabla).select('addon_id').eq('user_id', userId)) || [];
            var mapa = {};
            filas.forEach(function (f) { mapa[f.addon_id] = true; });
            return mapa;
        }, forzar);
    };

    cliente.invalidarContenido = function () {
        cache.borrar('addons');
        cache.borrar('addon:');
        cache.borrar('addons_u:');
    };
    cliente.invalidarPerfil = function (id) {
        cache.borrar('perfil:' + (id || ''));
        cache.borrar('usuarios');
    };

    cliente.auth.onAuthStateChange(function (evento) {
        if (evento === 'SIGNED_OUT') {
            cache.borrar('likes:');
            cache.borrar('favorites:');
            cache.borrar('perfil:');
            cache.borrar('addons_u:');
        }
    });

    var AJUSTES = {
        'avatars': { max: 256, calidad: 0.82, cuadrada: true },
        'perfil-banners': { max: 1200, calidad: 0.7 },
        'portadas': { max: 720, calidad: 0.75, cuadrada: true },
        'banners': { max: 1100, calidad: 0.62 },
        'galeria': { ancho: 1200, alto: 675, calidad: 0.6 }
    };
    AJUSTES.avatar = AJUSTES['avatars'];
    AJUSTES.perfilBanner = AJUSTES['perfil-banners'];

    var MAX_ARCHIVO_ENTRADA = 20 * 1024 * 1024;

    function formatoSalida() {
        try {
            var c = document.createElement('canvas');
            c.width = c.height = 1;
            if (c.toDataURL('image/webp').indexOf('data:image/webp') === 0) return 'image/webp';
        } catch (e) { }
        return 'image/jpeg';
    }

    function procesarImagen(archivo, opciones) {
        var max = (opciones && opciones.max) || 960;
        return new Promise(function (resolver, rechazar) {
            if (!archivo || !/^image\//.test(archivo.type || '')) {
                rechazar(new Error('El archivo no es una imagen válida.'));
                return;
            }
            if (archivo.size > MAX_ARCHIVO_ENTRADA) {
                rechazar(new Error('La imagen es demasiado pesada (máximo 20 MB).'));
                return;
            }
            var lector = new FileReader();
            lector.onerror = function () { rechazar(new Error('No se pudo leer la imagen.')); };
            lector.onload = function () {
                var img = new Image();
                img.onerror = function () { rechazar(new Error('No se pudo abrir la imagen.')); };
                img.onload = function () {
                    var cuadrada = !!(opciones && opciones.cuadrada);
                    var exacta = !!(opciones && opciones.ancho && opciones.alto);
                    var origW, origH, origX, origY, w, h;
                    if (exacta) {
                        w = opciones.ancho;
                        h = opciones.alto;
                        var relDestino = w / h;
                        var relOrigen = img.width / img.height;
                        if (relOrigen > relDestino) {
                            origH = img.height;
                            origW = Math.round(img.height * relDestino);
                        } else {
                            origW = img.width;
                            origH = Math.round(img.width / relDestino);
                        }
                        origX = Math.round((img.width - origW) / 2);
                        origY = Math.round((img.height - origH) / 2);
                    } else {
                        var lado = Math.min(img.width, img.height);
                        origW = cuadrada ? lado : img.width;
                        origH = cuadrada ? lado : img.height;
                        origX = cuadrada ? Math.round((img.width - lado) / 2) : 0;
                        origY = cuadrada ? Math.round((img.height - lado) / 2) : 0;
                        var escala = Math.min(1, max / Math.max(origW, origH));
                        w = Math.max(1, Math.round(origW * escala));
                        h = Math.max(1, Math.round(origH * escala));
                    }
                    var lienzo = document.createElement('canvas');
                    lienzo.width = w;
                    lienzo.height = h;
                    var ctx = lienzo.getContext('2d');
                    var formato = formatoSalida();
                    if (formato === 'image/jpeg') {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, w, h);
                    }
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, origX, origY, origW, origH, 0, 0, w, h);
                    resolver({ lienzo: lienzo, formato: formato });
                };
                img.src = lector.result;
            };
            lector.readAsDataURL(archivo);
        });
    }

    function imagenADataURL(archivo, opciones) {
        var calidad = (opciones && opciones.calidad) || 0.7;
        return procesarImagen(archivo, opciones).then(function (r) {
            return r.lienzo.toDataURL(r.formato, calidad);
        });
    }

    function imagenABlob(archivo, opciones) {
        var calidad = (opciones && opciones.calidad) || 0.7;
        return procesarImagen(archivo, opciones).then(function (r) {
            return new Promise(function (resolver, rechazar) {
                r.lienzo.toBlob(function (blob) {
                    if (blob) resolver(blob); else rechazar(new Error('No se pudo preparar la imagen.'));
                }, r.formato, calidad);
            });
        });
    }

    function dataURLaBlob(dataUrl) {
        var partes = String(dataUrl).split(',');
        var mime = (partes[0].match(/data:([^;]+)/) || [])[1] || 'image/webp';
        var bin = atob(partes[1] || '');
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Blob([bytes], { type: mime });
    }

    function nuevoId() {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
    }

    function esNuevo(valor) {
        return (typeof valor === 'string' && valor.indexOf('data:image/') === 0) ||
            (typeof Blob !== 'undefined' && valor instanceof Blob);
    }

    var BASE_PUBLICA = URL_BASE + '/storage/v1/object/public/';

    function rutaDesdeUrl(url) {
        if (typeof url !== 'string' || url.indexOf(BASE_PUBLICA) !== 0) return null;
        var resto = url.slice(BASE_PUBLICA.length).split('?')[0];
        var i = resto.indexOf('/');
        if (i < 1) return null;
        try {
            return { bucket: resto.slice(0, i), path: decodeURIComponent(resto.slice(i + 1)) };
        } catch (e) {
            return null;
        }
    }

    async function subirImagen(bucket, userId, fuente) {
        var ajustes = AJUSTES[bucket] || AJUSTES.portadas;
        var blob;
        if (typeof fuente === 'string') blob = dataURLaBlob(fuente);
        else blob = await imagenABlob(fuente, ajustes);
        var ext = blob.type === 'image/webp' ? 'webp' : (blob.type === 'image/png' ? 'png' : 'jpg');
        var ruta = userId + '/' + nuevoId() + '.' + ext;
        var res = await cliente.storage.from(bucket).upload(ruta, blob, {
            contentType: blob.type,
            cacheControl: '31536000',
            upsert: false
        });
        if (res.error) throw res.error;
        var pub = cliente.storage.from(bucket).getPublicUrl(res.data.path);
        return pub.data.publicUrl;
    }

    async function borrarImagenes(urls) {
        var porBucket = {};
        (urls || []).forEach(function (u) {
            var r = rutaDesdeUrl(u);
            if (!r) return;
            (porBucket[r.bucket] = porBucket[r.bucket] || []).push(r.path);
        });
        var total = 0;
        var buckets = Object.keys(porBucket);
        for (var i = 0; i < buckets.length; i++) {
            var b = buckets[i];
            var rutas = porBucket[b].filter(function (p, idx, arr) { return arr.indexOf(p) === idx; });
            try {
                var res = await cliente.storage.from(b).remove(rutas);
                if (res.error) console.warn('No se pudo borrar imagen anterior:', res.error.message);
                else total += (res.data || []).length;
            } catch (e) {
                console.warn('No se pudo borrar imagen anterior:', e);
            }
        }
        return total;
    }

    function sesionImagenes(userId) {
        var subidas = [];
        return {
            subir: async function (bucket, valor) {
                if (!valor) return null;
                if (!esNuevo(valor)) return valor;
                var url = await subirImagen(bucket, userId, valor);
                subidas.push(url);
                return url;
            },
            subirVarias: async function (bucket, lista) {
                var self = this;
                var resultados = await Promise.allSettled((lista || []).map(function (v) { return self.subir(bucket, v); }));
                var fallo = resultados.find(function (r) { return r.status === 'rejected'; });
                if (fallo) {
                    await self.revertir();
                    throw fallo.reason;
                }
                return resultados.map(function (r) { return r.value; });
            },
            revertir: async function () {
                var lista = subidas;
                subidas = [];
                await borrarImagenes(lista);
            },
            limpiar: async function (anteriores, finales) {
                var vigentes = {};
                (finales || []).forEach(function (u) { if (u) vigentes[u] = true; });
                var sobran = (anteriores || []).filter(function (u) { return u && !vigentes[u]; });
                return borrarImagenes(sobran);
            }
        };
    }

    cliente.imagenes = {
        ajustes: AJUSTES,
        aDataURL: imagenADataURL,
        aBlob: imagenABlob,
        subir: subirImagen,
        borrar: borrarImagenes,
        rutaDesdeUrl: rutaDesdeUrl,
        sesion: sesionImagenes
    };
    cliente.imagenADataURL = imagenADataURL;
    cliente.ajustes = AJUSTES;
    cliente.cache = cache;

    function traducir(err) {
        var m = String((err && (err.message || err.error_description)) || err || '');
        var c = String((err && err.code) || '');
        if (/Failed to fetch|NetworkError|Load failed|network/i.test(m)) return 'No se pudo alcanzar Supabase. Puede estar pausado el proyecto (Supabase > Project > Restore), no haber internet o haber un bloqueador de contenido.';
        if (/Invalid API key|apikey|JWT/i.test(m)) return 'La clave de Supabase no es válida o fue regenerada. Revisa la Publishable key en Project Settings > API Keys.';
        if (c === 'PGRST205' || c === '42P01' || /Could not find the table|does not exist/i.test(m)) return 'Las tablas no existen en esta base de datos. Ejecuta el SQL completo en el SQL Editor.';
        if (c === '42501' || /permission denied/i.test(m)) return 'Faltan permisos en las tablas. Vuelve a ejecutar el SQL completo (incluye los GRANT y las políticas RLS).';
        return m || 'Error desconocido.';
    }

    function comprobarConexion(detallado) {
        var lineas = [];
        function ok(t) { lineas.push('OK  ' + t); }
        function mal(t) { lineas.push('ERROR  ' + t); }
        ok('Librería de Supabase cargada');
        ok('Configuración: ' + URL_BASE.slice(0, 16) + '…supabase.co | clave ' + CLAVE.slice(0, 15) + '… (' + CLAVE.length + ' caracteres)');
        return fetch(URL_BASE + '/auth/v1/health', { headers: { apikey: CLAVE } })
            .then(function (r) {
                if (r.ok) ok('Servidor de autenticación responde (' + r.status + ')');
                else mal('Servidor de autenticación respondió ' + r.status);
            }, function (e) { mal('Sin conexión con Supabase: ' + traducir(e)); })
            .then(function () { return cliente.from('tipos_publicacion').select('id').limit(1); })
            .then(function (res) {
                if (res.error) { mal('Tablas: ' + traducir(res.error)); return false; }
                ok('Tablas accesibles (' + (res.data || []).length + ' filas de prueba)');
                return true;
            }, function (e) { mal('Tablas: ' + traducir(e)); return false; })
            .then(function (tablasOk) {
                var hayError = lineas.some(function (l) { return l.indexOf('ERROR') === 0; });
                if (hayError) avisar('No se pudo conectar con la base de datos\n' + lineas.join('\n'));
                else if (detallado) avisar('Conexión correcta\n' + lineas.join('\n'), '#15803d');
                return tablasOk;
            });
    }

    var pedirDiagnostico = /[?&]diag=1(&|$)/.test(location.search);
    function iniciarComprobacion() {
        var hecho = false;
        try { hecho = sessionStorage.getItem('fg_diag_ok') === '1'; } catch (e) { }
        if (hecho && !pedirDiagnostico) return;
        comprobarConexion(pedirDiagnostico).then(function (bien) {
            if (bien) { try { sessionStorage.setItem('fg_diag_ok', '1'); } catch (e) { } }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarComprobacion);
    else iniciarComprobacion();

    cliente.diagnostico = function () { return comprobarConexion(true); };
    cliente.traducirError = traducir;

    window.mcDB = cliente;
})();
