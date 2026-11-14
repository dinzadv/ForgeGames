/* =====================================================
   ForgeGames — utilidades compartidas
   Tipos de publicación, precios, videos y tarjetas.
   ===================================================== */
(function () {
    'use strict';

    /* ---------- Tipos de publicación ---------- */
    var TIPOS = [
        {
            id: 'addon', catId: 'addons', nombre: 'Add-On', plural: 'Add-Ons',
            desc: 'Mecánicas, armas y comportamientos nuevos para jugar distinto.',
            c: '#6366f1', osc: '#4338ca', t: '#ffffff',
            icono: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>'
        },
        {
            id: 'modelo', catId: 'modelos', nombre: 'Modelo', plural: 'Modelos',
            desc: 'Entidades, bloques y objetos 3D con forma propia.',
            c: '#06b6d4', osc: '#0e7490', t: '#042f3a',
            icono: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'
        },
        {
            id: 'sprites', catId: 'sprites', nombre: 'Menús y Sprites', plural: 'Sprites/Menús',
            desc: 'Interfaces, menús, iconos y sprites para personalizar el juego.',
            c: '#ec4899', osc: '#be185d', t: '#ffffff',
            icono: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'
        },
        {
            id: 'servidor', catId: 'servidores', nombre: 'Servidor', plural: 'Servidores',
            desc: 'Servidores de Java, Bedrock y Realms para jugar con otros.',
            c: '#43b039', osc: '#2c8a26', t: '#ffffff',
            icono: '<rect x="2" y="3" width="20" height="7" rx="1"/><rect x="2" y="14" width="20" height="7" rx="1"/><path d="M6 6.5h.01M6 17.5h.01"/>'
        }
    ];

    var TIPO_POR_ID = {};
    var TIPO_POR_CAT = {};
    TIPOS.forEach(function (t) { TIPO_POR_ID[t.id] = t; TIPO_POR_CAT[t.catId] = t; });

    function tipoDe(addon) {
        var id = addon && addon.tipo;
        return TIPO_POR_ID[id] ? id : 'addon'; // las publicaciones antiguas eran Add-Ons
    }

    function svgTipo(t) {
        return '<svg viewBox="0 0 24 24">' + t.icono + '</svg>';
    }

    function estiloTipo(t) {
        return '--c:' + t.c + ';--c-osc:' + t.osc + ';--texto:' + t.t + ';--cc:' + t.c + ';--cco:' + t.osc + ';--ct:' + t.t;
    }

    /* ---------- Monedas ---------- */
    var MONEDAS = [
        ['USD', 'Dólar estadounidense', 'Estados Unidos', '$'],
        ['EUR', 'Euro', 'Eurozona', '€'],
        ['MXN', 'Peso mexicano', 'México', '$'],
        ['ARS', 'Peso argentino', 'Argentina', '$'],
        ['COP', 'Peso colombiano', 'Colombia', '$'],
        ['CLP', 'Peso chileno', 'Chile', '$'],
        ['PEN', 'Sol peruano', 'Perú', 'S/'],
        ['BRL', 'Real brasileño', 'Brasil', 'R$'],
        ['VES', 'Bolívar venezolano', 'Venezuela', 'Bs.'],
        ['UYU', 'Peso uruguayo', 'Uruguay', '$U'],
        ['BOB', 'Boliviano', 'Bolivia', 'Bs'],
        ['PYG', 'Guaraní paraguayo', 'Paraguay', '₲'],
        ['DOP', 'Peso dominicano', 'Rep. Dominicana', 'RD$'],
        ['GTQ', 'Quetzal', 'Guatemala', 'Q'],
        ['CRC', 'Colón costarricense', 'Costa Rica', '₡'],
        ['HNL', 'Lempira', 'Honduras', 'L'],
        ['NIO', 'Córdoba', 'Nicaragua', 'C$'],
        ['PAB', 'Balboa', 'Panamá', 'B/.'],
        ['CUP', 'Peso cubano', 'Cuba', '$'],
        ['GBP', 'Libra esterlina', 'Reino Unido', '£'],
        ['CAD', 'Dólar canadiense', 'Canadá', '$'],
        ['AUD', 'Dólar australiano', 'Australia', '$'],
        ['CHF', 'Franco suizo', 'Suiza', 'CHF'],
        ['JPY', 'Yen japonés', 'Japón', '¥'],
        ['KRW', 'Won surcoreano', 'Corea del Sur', '₩'],
        ['CNY', 'Yuan chino', 'China', '¥'],
        ['INR', 'Rupia india', 'India', '₹'],
        ['IDR', 'Rupia indonesia', 'Indonesia', 'Rp'],
        ['PHP', 'Peso filipino', 'Filipinas', '₱'],
        ['TRY', 'Lira turca', 'Turquía', '₺'],
        ['PLN', 'Esloti polaco', 'Polonia', 'zł'],
        ['RUB', 'Rublo ruso', 'Rusia', '₽']
    ];

    function simboloMoneda(codigo) {
        for (var i = 0; i < MONEDAS.length; i++) if (MONEDAS[i][0] === codigo) return MONEDAS[i][3];
        return '';
    }

    function precioActivo(addon) {
        return !!(addon && (addon.precio_activo === true || addon.precio_activo === 'true') && Number(addon.precio_monto) > 0);
    }

    function textoPrecio(addon) {
        if (!precioActivo(addon)) return 'Free';
        var monto = Number(addon.precio_monto);
        var txt = monto.toLocaleString('es-ES', { minimumFractionDigits: monto % 1 ? 2 : 0, maximumFractionDigits: 2 });
        return simboloMoneda(addon.precio_moneda) + txt + ' ' + (addon.precio_moneda || '');
    }

    /* ---------- Contacto de ventas ---------- */
    var NOMBRE_TIPO_VENTA = { addon: 'Add-On', modelo: 'Modelo', sprites: 'Sprite' };

    function contactoVenta(addon) {
        var wa = String((addon && addon.contacto_whatsapp) || '').replace(/\D/g, '');
        if (wa.length < 8 || wa.length > 15) wa = '';
        return { whatsapp: wa, discord: String((addon && addon.contacto_discord) || '').trim() };
    }

    function ventaPorContacto(addon) {
        if (!precioActivo(addon) || tipoDe(addon) === 'servidor') return false;
        var c = contactoVenta(addon);
        return !!(c.whatsapp || c.discord);
    }

    function mensajeCompra(addon, url) {
        var tipo = NOMBRE_TIPO_VENTA[tipoDe(addon)] || 'Add-On';
        return 'Quiero comprar este ' + tipo + ' ' + (addon.nombre || '') + '\n' + url;
    }

    /* ---------- Texto y números ---------- */
    function esc(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function formatearNumero(num) {
        num = Number(num) || 0;
        if (num < 0) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return String(num);
    }

    function fechaCorta(addon, vacio) {
        var bruta = addon && (addon.fecha || addon.created_at);
        var d = bruta ? new Date(bruta) : null;
        if (!d || isNaN(d.getTime())) return vacio || 'Reciente';
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function urlSegura(u) {
        u = String(u || '').trim();
        return /^https?:\/\/[^\s]+$/i.test(u) ? u : '';
    }

    function listaJson(valor) {
        if (Array.isArray(valor)) return valor;
        try {
            var r = JSON.parse(valor || '[]');
            return Array.isArray(r) ? r : [];
        } catch (e) {
            return [];
        }
    }

    /* ---------- Videos ---------- */
    function parsearVideo(url) {
        url = String(url || '').trim();
        if (!url) return null;
        var m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
        if (m) {
            return {
                tipo: 'youtube', id: m[1], url: url,
                embed: 'https://www.youtube.com/embed/' + m[1] + '?rel=0',
                miniatura: 'https://img.youtube.com/vi/' + m[1] + '/hqdefault.jpg'
            };
        }
        if (/^[A-Za-z0-9_-]{11}$/.test(url)) { // solo el ID (publicaciones antiguas)
            return {
                tipo: 'youtube', id: url, url: 'https://youtu.be/' + url,
                embed: 'https://www.youtube.com/embed/' + url + '?rel=0',
                miniatura: 'https://img.youtube.com/vi/' + url + '/hqdefault.jpg'
            };
        }
        var v = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (v) return { tipo: 'vimeo', id: v[1], url: url, embed: 'https://player.vimeo.com/video/' + v[1], miniatura: '' };
        if (/^https?:\/\//i.test(url)) {
            if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url)) return { tipo: 'archivo', url: url, src: url, miniatura: '' };
            return { tipo: 'enlace', url: url, miniatura: '' };
        }
        return null;
    }

    function videosDe(addon) {
        var lista = listaJson(addon && addon.videos).slice();
        if (addon && addon.youtube_id && String(addon.youtube_id).trim()) lista.unshift(addon.youtube_id);
        var vistos = {};
        return lista.map(parsearVideo).filter(function (v) {
            if (!v || vistos[v.url]) return false;
            vistos[v.url] = true;
            return true;
        });
    }

    /* ---------- Servidores ---------- */
    var PLATAFORMAS_SERVIDOR = { java: 'Java', bedrock: 'Bedrock', realms: 'Realms' };
    var PUERTO_POR_DEFECTO = { java: '25565', bedrock: '19132' };

    function etiquetaPlataformaServidor(addon) {
        var p = addon.plataforma;
        var nombre = PLATAFORMAS_SERVIDOR[p] || 'Java';
        if (addon.multiplataforma && (p === 'java' || p === 'bedrock')) return 'Java + Bedrock';
        return nombre;
    }

    function enlaceBedrock(nombre, ip, puerto) {
        return 'minecraft://?addExternalServer=' + encodeURIComponent(nombre || 'Servidor') + '|' + ip + ':' + (puerto || '19132');
    }

    function textoIp(addon) {
        if (addon.plataforma === 'realms') return 'Realm';
        var ip = addon.ip || '';
        var puerto = addon.puerto || '';
        return puerto && puerto !== PUERTO_POR_DEFECTO[addon.plataforma] ? ip + ':' + puerto : ip;
    }

    /* ---------- Tarjeta por tipo ---------- */
    var ICONO_LIKE = '<svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
    var ICONO_DESCARGA = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    var ICONO_RELOJ = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
    var ICONO_SERVIDOR = '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="7" rx="1"/><rect x="2" y="14" width="20" height="7" rx="1"/><path d="M6 6.5h.01M6 17.5h.01"/></svg>';
    var ICONO_ETIQUETA = '<svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7" y2="7"/></svg>';

    function cardInterior(addon, opciones) {
        opciones = opciones || {};
        var idTipo = tipoDe(addon);
        var tipo = TIPO_POR_ID[idTipo];
        var esServidor = idTipo === 'servidor';
        var nombre = esc(addon.nombre || 'Sin nombre');
        var descripcion = esc(addon.descripcion || 'Sin descripción disponible.');
        var bannerTarjeta = opciones.usarBanner && addon.banner ? addon.banner : '';
        var portada = esc(bannerTarjeta || addon.portada || '');
        var destinoError = opciones.imgError || '';
        var onError;
        if (bannerTarjeta && addon.portada && addon.portada !== bannerTarjeta) {
            // si el banner falla, probar con la portada
            onError = "this.onerror=" + (destinoError
                ? "function(){this.onerror=null;this.src='" + destinoError + "'}"
                : "function(){this.style.display='none'}") + ";this.src='" + esc(addon.portada) + "'";
        } else {
            onError = destinoError
                ? "this.onerror=null;this.src='" + destinoError + "'"
                : "this.style.display='none'";
        }

        var chipDerecha = esServidor
            ? '<div class="addon-badge-version" title="Plataforma">' + esc(etiquetaPlataformaServidor(addon)) + '</div>'
            : (addon.version ? '<div class="addon-badge-version" title="Versión de Minecraft">' + esc(addon.version) + '</div>' : '');

        var chipPrecio = '';
        if (!esServidor) {
            var pago = precioActivo(addon);
            chipPrecio = '<div class="chip-precio ' + (pago ? 'es-pago' : 'es-gratis') + '" title="Precio">' + esc(textoPrecio(addon)) + '</div>';
        }

        var chipTipo = '<div class="chip-tipo" style="' + estiloTipo(tipo) + '" title="Tipo de publicación">' + svgTipo(tipo) + '<span>' + esc(tipo.nombre) + '</span></div>';

        var izquierda = esServidor
            ? '<div class="addon-premium-meta-item meta-descargas meta-ip" title="Dirección del servidor">' + ICONO_SERVIDOR + '<span>' + esc(textoIp(addon) || 'Sin IP') + '</span></div>'
            : '<div class="addon-premium-meta-item meta-descargas" title="Descargas">' + ICONO_DESCARGA + '<span>' + formatearNumero(addon.descargas) + '</span></div>';

        return '' +
            '<div class="addon-premium-cabecera">' +
                '<img src="' + portada + '" alt="' + nombre + '" class="addon-premium-img" onerror="' + onError + '">' +
                '<div class="addon-premium-badges">' +
                    '<div class="addon-badge-votos" title="Me gusta">' + ICONO_LIKE + '<span>' + formatearNumero(addon.likes) + '</span></div>' +
                    chipDerecha +
                '</div>' +
                '<div class="addon-premium-pie">' + chipTipo + chipPrecio + '</div>' +
            '</div>' +
            '<div class="addon-premium-info">' +
                '<h4 class="addon-premium-titulo">' + nombre + '</h4>' +
                '<p class="addon-premium-descripcion">' + descripcion + '</p>' +
                '<div class="addon-premium-detalles-linea">' +
                    izquierda +
                    '<div class="addon-premium-meta-item meta-fecha" title="Fecha de publicación">' + ICONO_RELOJ + '<span>' + esc(fechaCorta(addon)) + '</span></div>' +
                '</div>' +
            '</div>';
    }

    window.McShared = {
        TIPOS: TIPOS,
        TIPO_POR_ID: TIPO_POR_ID,
        TIPO_POR_CAT: TIPO_POR_CAT,
        tipoDe: tipoDe,
        svgTipo: svgTipo,
        estiloTipo: estiloTipo,
        MONEDAS: MONEDAS,
        simboloMoneda: simboloMoneda,
        precioActivo: precioActivo,
        contactoVenta: contactoVenta,
        ventaPorContacto: ventaPorContacto,
        mensajeCompra: mensajeCompra,
        textoPrecio: textoPrecio,
        esc: esc,
        formatearNumero: formatearNumero,
        fechaCorta: fechaCorta,
        urlSegura: urlSegura,
        listaJson: listaJson,
        parsearVideo: parsearVideo,
        videosDe: videosDe,
        PLATAFORMAS_SERVIDOR: PLATAFORMAS_SERVIDOR,
        PUERTO_POR_DEFECTO: PUERTO_POR_DEFECTO,
        etiquetaPlataformaServidor: etiquetaPlataformaServidor,
        enlaceBedrock: enlaceBedrock,
        textoIp: textoIp,
        cardInterior: cardInterior,
        iconos: {
            like: ICONO_LIKE, descarga: ICONO_DESCARGA, reloj: ICONO_RELOJ,
            servidor: ICONO_SERVIDOR, etiqueta: ICONO_ETIQUETA
        }
    };
})();
