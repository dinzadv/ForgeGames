const rutasNavegacionAndEnlacesMcpixel = {
    login: "../login/",
    register: "../register/",
    inicio: "../",
    explorar: "../explore/",
    profile: "../profile/",
    view: "../view/",
    post: "../post/",
    favorites: "../favorites/",
    profileView: "../user/",
    conversor: "../conversor/"
};

document.getElementById('btnAuthLoginMenu').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.login);
document.getElementById('btnAuthRegistroMenu').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.register);
document.getElementById('menuLinkInicio').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.inicio);
document.getElementById('menuLinkExplorar').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.explorar);
document.getElementById('menuLinkPerfil').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.profile);
document.getElementById('menuLinkFavoritos').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.favorites);
document.getElementById('logoInicio').addEventListener('click', () => {
    window.location.href = rutasNavegacionAndEnlacesMcpixel.inicio;
});

const T = window.McShared;
let currentUser = null;
let userLikes = {};
let userFavorites = {};

async function verificarSesion() {
    try {
        const { data: { session } } = await mcDB.auth.getSession();

        if (!session) {
            document.getElementById('contenedorAutenticacion').style.display = 'flex';
            return;
        }

        currentUser = session.user;
        document.getElementById('contenedorAutenticacion').style.display = 'none';
        const elementosBloqueados = ['menuLinkPerfil', 'menuLinkFavoritos'];
        elementosBloqueados.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('deshabilitado');
            }
        });
        try {
            const doc = await mcDB.obtenerPerfil(session.user.id);

            if (doc && doc.avatar) {
                const contenedorPerfil = document.getElementById('perfilBtn');
                contenedorPerfil.innerHTML = `<img src="${McShared.esc(doc.avatar)}" alt="Avatar" class="perfil-img-activa">`;
            }
        } catch (e) {
            console.log("Error al obtener el avatar:", e);
        }
        await obtenerLikesUsuario();
        await obtenerFavoritosUsuario();
    } catch (error) {
        document.getElementById('contenedorAutenticacion').style.display = 'flex';
    }
}

async function obtenerLikesUsuario() {
    if (!currentUser) return;
    try {
        userLikes = await mcDB.idsDe('likes', currentUser.id);
    } catch (e) {
        console.log("Error al obtener likes del usuario:", e);
    }
}

async function obtenerFavoritosUsuario() {
    if (!currentUser) return;
    try {
        userFavorites = await mcDB.idsDe('favorites', currentUser.id);
    } catch (e) {
        console.log("Error al obtener favoritos del usuario:", e);
    }
}

async function obtenerAddonPorId(id) {
    try {
        return await mcDB.obtenerAddon(id);
    } catch (e) {
        console.log("Error al obtener addon:", e);
        return null;
    }
}

async function obtenerAddonsPublicados() {
    try {
        return await mcDB.listarAddons();
    } catch (e) {
        return [];
    }
}

async function obtenerUsuario(userId) {
    try {
        return await mcDB.obtenerPerfil(userId);
    } catch (e) {
        return null;
    }
}

function formatearNumero(num) {
    if (num < 0) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function formatearInline(linea) {
    const guardados = [];
    const guardar = (html) => '\u0000' + (guardados.push(html) - 1) + '\u0000';
    let t = T.esc(linea);

    t = t.replace(/`([^`\n]+)`/g, (m, c) => guardar('<code class="md-codigo">' + c + '</code>'));

    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, txt, url) =>
        guardar('<a href="' + url + '" target="_blank" rel="noopener noreferrer nofollow">' + txt + '</a>'));

    t = t.replace(/https?:\/\/[^\s\u0000]+/g, (m) => {
        const limpio = m.replace(/(?:&quot;|&#39;|&lt;|&gt;|[.,;:!?)])+$/, '');
        const resto = m.slice(limpio.length);
        return guardar('<a href="' + limpio + '" target="_blank" rel="noopener noreferrer nofollow">' + limpio + '</a>') + resto;
    });

    t = t.replace(/(^|[\s(])\/([a-zA-Z][\w-]*(?::[\w-]+)?)(?=$|[\s.,;:!?)])/g,
        (m, pre, cmd) => pre + guardar('<span class="md-comando">/' + cmd + '</span>'));

    t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
    t = t.replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?![*\w])/g, '$1<em>$2</em>');
    t = t.replace(/(^|[^_\w])_([^_\s][^_\n]*?)_(?![_\w])/g, '$1<em>$2</em>');

    return t.replace(/\u0000(\d+)\u0000/g, (m, i) => guardados[+i]);
}

function procesarDescripcion(texto) {
    if (!texto) return '';
    const lineas = String(texto).replace(/\r\n?/g, '\n').split('\n');
    const salida = [];
    let parrafo = [];
    let lista = null;

    const cerrarParrafo = () => {
        if (parrafo.length) salida.push('<p>' + parrafo.map(formatearInline).join('<br>') + '</p>');
        parrafo = [];
    };
    const cerrarLista = () => {
        if (lista) {
            salida.push('<' + lista.tipo + '>' + lista.items.map(i => '<li>' + formatearInline(i) + '</li>').join('') + '</' + lista.tipo + '>');
        }
        lista = null;
    };

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];

        if (/^\s*```/.test(linea)) {
            cerrarParrafo(); cerrarLista();
            const codigo = [];
            i++;
            while (i < lineas.length && !/^\s*```/.test(lineas[i])) { codigo.push(lineas[i]); i++; }
            salida.push('<pre class="md-bloque"><code>' + T.esc(codigo.join('\n')) + '</code></pre>');
            continue;
        }

        if (!linea.trim()) { cerrarParrafo(); cerrarLista(); continue; }

        let m;
        if ((m = linea.match(/^\s{0,3}-#\s+(.+?)\s*$/))) {
            cerrarParrafo(); cerrarLista();
            salida.push('<p class="md-subtexto">' + formatearInline(m[1]) + '</p>');
        } else if ((m = linea.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/))) {
            cerrarParrafo(); cerrarLista();
            salida.push('<h' + m[1].length + ' class="md-titulo">' + formatearInline(m[2]) + '</h' + m[1].length + '>');
        } else if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(linea)) {
            cerrarParrafo(); cerrarLista();
            salida.push('<hr class="md-linea">');
        } else if ((m = linea.match(/^\s*>\s?(.*)$/))) {
            cerrarParrafo(); cerrarLista();
            salida.push('<blockquote class="md-cita">' + formatearInline(m[1]) + '</blockquote>');
        } else if ((m = linea.match(/^\s*[-*+]\s+(.+)$/))) {
            cerrarParrafo();
            if (!lista || lista.tipo !== 'ul') { cerrarLista(); lista = { tipo: 'ul', items: [] }; }
            lista.items.push(m[1]);
        } else if ((m = linea.match(/^\s*\d+[.)]\s+(.+)$/))) {
            cerrarParrafo();
            if (!lista || lista.tipo !== 'ol') { cerrarLista(); lista = { tipo: 'ol', items: [] }; }
            lista.items.push(m[1]);
        } else {
            cerrarLista();
            parrafo.push(linea);
        }
    }
    cerrarParrafo(); cerrarLista();
    return salida.join('');
}

function extraerIdYoutube(url) {
    if (!url || url.trim() === '') return null;
    const patrones = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/,
        /youtube\.com\/embed\/([^?]+)/
    ];
    for (const patron of patrones) {
        const match = url.match(patron);
        if (match) return match[1];
    }
    return url.trim();
}

async function renderizarParaTi(addonActualId) {
    const contenedor = document.getElementById('scrollParaTi');
    const addons = await obtenerAddonsPublicados();
    contenedor.innerHTML = '';

    if (!addons || addons.length === 0) {
        const div = document.createElement('div');
        div.className = 'mensaje-vacio-para-ti';
        div.innerHTML = `
            <img src="../img/icons/ic4.png" alt="Sin complementos">
            <span>No hay complementos disponibles</span>
        `;
        contenedor.appendChild(div);
        return;
    }

    const filtrados = addons.filter(a => a.id !== addonActualId);
    const mezclados = [...filtrados].sort(() => Math.random() - 0.5);
    const seleccionados = mezclados.slice(0, 10);

    if (seleccionados.length === 0) {
        const div = document.createElement('div');
        div.className = 'mensaje-vacio-para-ti';
        div.innerHTML = `
            <img src="../img/icons/ic4.png" alt="Sin complementos">
            <span>No hay más complementos disponibles</span>
        `;
        contenedor.appendChild(div);
        return;
    }

    seleccionados.forEach(addon => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-para-ti';
        const portadaUrl = addon.banner || addon.portada || '';
        tarjeta.innerHTML = `
            <img src="${McShared.esc(portadaUrl)}" alt="${McShared.esc(addon.nombre || 'Addon')}" onerror="this.style.display='none'">
            <div class="overlay-para-ti"><span>${addon.nombre || 'Sin nombre'}</span></div>
        `;
        tarjeta.addEventListener('click', () => {
            window.location.href = window.location.pathname + '?id=' + addon.id;
        });
        contenedor.appendChild(tarjeta);
    });
}

async function renderizarMasDescargado(addonActualId) {
    const contenedor = document.getElementById('scrollMasDescargado');
    const addons = await obtenerAddonsPublicados();
    contenedor.innerHTML = '';

    if (!addons || addons.length === 0) {
        const div = document.createElement('div');
        div.className = 'mensaje-vacio-para-ti';
        div.innerHTML = `
            <img src="../img/icons/ic4.png" alt="Sin complementos">
            <span>No hay complementos disponibles</span>
        `;
        contenedor.appendChild(div);
        return;
    }

    const filtrados = addons.filter(a => a.id !== addonActualId);
    const ordenados = [...filtrados].sort((a, b) => (parseInt(b.descargas) || 0) - (parseInt(a.descargas) || 0));
    const seleccionados = ordenados.slice(0, 10);

    if (seleccionados.length === 0) {
        const div = document.createElement('div');
        div.className = 'mensaje-vacio-para-ti';
        div.innerHTML = `
            <img src="../img/icons/ic4.png" alt="Sin complementos">
            <span>No hay más complementos disponibles</span>
        `;
        contenedor.appendChild(div);
        return;
    }

    seleccionados.forEach(addon => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-para-ti';
        const portadaUrl = addon.banner || addon.portada || '';
        tarjeta.innerHTML = `
            <img src="${McShared.esc(portadaUrl)}" alt="${McShared.esc(addon.nombre || 'Addon')}" onerror="this.style.display='none'">
            <div class="overlay-para-ti"><span>${addon.nombre || 'Sin nombre'}</span></div>
        `;
        tarjeta.addEventListener('click', () => {
            window.location.href = window.location.pathname + '?id=' + addon.id;
        });
        contenedor.appendChild(tarjeta);
    });
}

function tiempoRelativo(fecha) {
    const d = new Date(fecha);
    if (!fecha || isNaN(d.getTime())) return 'Desconocida';
    const seg = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    const unidades = [
        { s: 31536000, singular: 'año', plural: 'años' },
        { s: 2592000, singular: 'mes', plural: 'meses' },
        { s: 86400, singular: 'día', plural: 'días' },
        { s: 3600, singular: 'hora', plural: 'horas' },
        { s: 60, singular: 'minuto', plural: 'minutos' }
    ];
    for (const u of unidades) {
        const n = Math.floor(seg / u.s);
        if (n >= 1) return 'hace ' + n + ' ' + (n === 1 ? u.singular : u.plural);
    }
    return 'hace un momento';
}

function cerrarModalCompartir() {
    const modal = document.getElementById('modalCompartir');
    if (!modal) return;
    modal.classList.remove('abierto');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function configurarCompartir(addon) {
    const modal = document.getElementById('modalCompartir');
    const campo = document.getElementById('compartirEnlace');
    const btnCopiar = document.getElementById('btnCopiarEnlace');
    const mensaje = document.getElementById('compartirMensaje');
    const btnNativo = document.getElementById('btnCompartirNativo');
    const url = window.location.href.split('#')[0];

    document.getElementById('compartirNombre').textContent = addon.nombre || 'Sin nombre';
    document.getElementById('compartirSub').textContent = T.TIPO_POR_ID[T.tipoDe(addon)].nombre + ' de ForgeGames';
    const icono = document.getElementById('compartirIcono');
    icono.src = addon.portada || '../img/logo.jpg';
    icono.onerror = function() {
        this.onerror = null;
        this.src = '../img/logo.jpg';
    };
    campo.value = url;

    let temporizador = null;
    const reiniciarCopiado = () => {
        btnCopiar.classList.remove('copiado');
        mensaje.classList.remove('visible');
    };

    document.getElementById('btnCompartir').onclick = () => {
        reiniciarCopiado();
        modal.classList.add('abierto');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };
    document.getElementById('btnCerrarCompartir').onclick = cerrarModalCompartir;
    modal.onclick = (e) => {
        if (e.target === modal) cerrarModalCompartir();
    };
    campo.onfocus = () => campo.select();

    btnCopiar.onclick = async () => {
        let copiado = false;
        try {
            await navigator.clipboard.writeText(url);
            copiado = true;
        } catch (err) {
            campo.focus();
            campo.select();
            try {
                copiado = document.execCommand('copy');
            } catch (e2) {
                copiado = false;
            }
        }
        mensaje.textContent = copiado ? 'Enlace copiado' : 'No se pudo copiar, selecciónalo manualmente';
        mensaje.style.color = copiado ? '#4ade80' : '#f87171';
        mensaje.classList.add('visible');
        if (copiado) btnCopiar.classList.add('copiado');
        clearTimeout(temporizador);
        temporizador = setTimeout(reiniciarCopiado, 2200);
    };

    if (navigator.share) {
        btnNativo.style.display = 'inline-flex';
        btnNativo.onclick = () => {
            navigator.share({ title: addon.nombre || 'ForgeGames', text: 'Mira esto en ForgeGames', url: url }).catch(() => {});
        };
    } else {
        btnNativo.style.display = 'none';
    }
}

function cerrarMenuAlternativas() {
    const menu = document.getElementById('menuAlternativas');
    const btn = document.getElementById('btnAlternativas');
    if (menu) menu.classList.remove('abierto');
    if (btn) btn.setAttribute('aria-expanded', 'false');
}

function guardarRutaDeRetorno() {
    try { sessionStorage.setItem('fg_volver', window.location.pathname + window.location.search); } catch (e) { }
}

function pedirSesionParaDescargar() {
    guardarRutaDeRetorno();
    window.location.href = rutasNavegacionAndEnlacesMcpixel.login;
}

async function manejarDescarga(e, addon, boton) {
    e.preventDefault();
    cerrarMenuAlternativas();
    if (!currentUser) {
        pedirSesionParaDescargar();
        return;
    }

    const ahora = Date.now();
    const ultimaDescarga = parseInt(localStorage.getItem('mcpixel_ultima_descarga_' + addon.id)) || 0;
    const cooldown = 10 * 60 * 1000;
    if (ahora - ultimaDescarga >= cooldown) {
        let descargas = parseInt(addon.descargas) || 0;
        descargas++;
        addon.descargas = descargas;
        document.getElementById('descargasContador').textContent = formatearNumero(descargas);
        document.getElementById('descargasMeta').textContent = formatearNumero(descargas) + ' descargas';
        localStorage.setItem('mcpixel_ultima_descarga_' + addon.id, ahora.toString());
        try {
            const { data: total, error } = await mcDB.rpc('registrar_descarga', { p_addon_id: addon.id });
            if (error) throw error;
            if (typeof total === 'number') {
                addon.descargas = total;
                document.getElementById('descargasContador').textContent = formatearNumero(total);
                document.getElementById('descargasMeta').textContent = formatearNumero(total) + ' descargas';
            }
            mcDB.cache.borrar('addon:' + addon.id);
        } catch (err) {
            console.log("Error al actualizar descargas:", err);
        }
    }
    if (boton.url && boton.url.startsWith('http')) {
        window.open(boton.url, '_blank');
    }
}

const SVG_WHATSAPP = '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5h.5a8.5 8.5 0 0 1 8 8z"/></svg>';
const SVG_DISCORD = '<svg viewBox="0 0 24 24"><path d="M20 4a17 17 0 0 0-4.2-1.3l-.5 1a15 15 0 0 0-4.6 0l-.5-1A17 17 0 0 0 6 4C3.5 8 2.8 11.800 3.100 15.500A17 17 0 0 0 8.200 18l1-1.600a11 11 0 0 1-1.600-.8l.4-.3a12 12 0 0 0 8 0l.4.3a11 11 0 0 1-1.600.8l1 1.600a17 17 0 0 0 5.100-2.500C21.200 11.200 20.300 7.600 20 4z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/></svg>';

function urlPublicacion(addon) {
    return window.location.origin + window.location.pathname + '?id=' + encodeURIComponent(addon.id);
}

function abrirContactoVenta(addon) {
    const contacto = T.contactoVenta(addon);
    const mensaje = T.mensajeCompra(addon, urlPublicacion(addon));

    let modal = document.getElementById('modalContactoVenta');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.className = 'modal-compartir';
    modal.id = 'modalContactoVenta';
    modal.setAttribute('aria-hidden', 'true');

    const esUrlDiscord = !!T.urlSegura(contacto.discord);
    const opciones = [];
    if (contacto.whatsapp) {
        opciones.push(`
            <div class="opcion-contacto">
                <div class="opcion-contacto-info">${SVG_WHATSAPP}<div><strong>WhatsApp</strong><span>+${T.esc(contacto.whatsapp)}</span></div></div>
                <a class="btn-pixel btn-mini" id="btnContactoWhatsapp" target="_blank" rel="noopener noreferrer"
                   href="https://wa.me/${T.esc(contacto.whatsapp)}?text=${encodeURIComponent(mensaje)}"><span>Abrir WhatsApp</span></a>
            </div>`);
    }
    if (contacto.discord) {
        opciones.push(`
            <div class="opcion-contacto">
                <div class="opcion-contacto-info">${SVG_DISCORD}<div><strong>Discord</strong><span>${T.esc(contacto.discord)}</span></div></div>
                ${esUrlDiscord
                    ? `<a class="btn-pixel acento btn-mini" id="btnContactoDiscord" target="_blank" rel="noopener noreferrer" href="${T.esc(contacto.discord)}"><span>Abrir Discord</span></a>`
                    : `<button type="button" class="btn-pixel acento btn-mini" id="btnContactoDiscord"><span>Copiar y abrir</span></button>`}
            </div>`);
    }

    modal.innerHTML = `
        <div class="modal-compartir-caja" role="dialog" aria-modal="true" aria-labelledby="modalContactoTitulo">
            <div class="modal-compartir-interno">
                <div class="modal-cabecera">
                    <div class="modal-titulo" id="modalContactoTitulo">${SVG_WHATSAPP}<span>Contactar al creador</span></div>
                    <button class="btn-pixel neutro btn-cerrar-modal" id="btnCerrarContacto" type="button" aria-label="Cerrar">
                        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <p class="contacto-intro">Elige cómo quieres hablar con el creador para comprar <strong>${T.esc(addon.nombre || 'esta publicación')}</strong> (${T.esc(T.textoPrecio(addon))}).</p>
                <div>
                    <div class="modal-enlace-etiqueta">Mensaje que se enviará</div>
                    <pre class="contacto-mensaje" id="contactoMensaje">${T.esc(mensaje)}</pre>
                </div>
                <div class="lista-opciones-contacto">${opciones.join('')}</div>
                <p class="contacto-nota" id="contactoNota"></p>
            </div>
        </div>`;
    document.body.appendChild(modal);

    const cerrar = () => {
        modal.classList.remove('abierto');
        modal.setAttribute('aria-hidden', 'true');
        document.removeEventListener('keydown', alTeclear);
        setTimeout(() => modal.remove(), 250);
    };
    const alTeclear = (e) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', alTeclear);
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });
    modal.querySelector('#btnCerrarContacto').addEventListener('click', cerrar);

    const btnDiscord = modal.querySelector('#btnContactoDiscord');
    if (btnDiscord && !esUrlDiscord) {
        btnDiscord.addEventListener('click', async () => {
            let ok = false;
            try { await navigator.clipboard.writeText(mensaje); ok = true; } catch (err) { ok = false; }
            modal.querySelector('#contactoNota').textContent = ok
                ? 'Mensaje copiado. En Discord, busca a «' + contacto.discord + '» y pégalo en un mensaje directo.'
                : 'Copia el mensaje de arriba y envíalo por mensaje directo a «' + contacto.discord + '» en Discord.';
            window.open('https://discord.com/channels/@me', '_blank', 'noopener');
        });
    }

    requestAnimationFrame(() => {
        modal.classList.add('abierto');
        modal.setAttribute('aria-hidden', 'false');
    });
}

const ICONOS_RED = {
    web_url: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    discord_url: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5h.5a8.5 8.5 0 0 1 8 8z"/>',
    tienda: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10 9 16 12 10 15 10 9"/>',
    tiktok: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>',
    twitch: '<path d="M4 3h17v11l-5 5h-4l-3 3v-3H4z"/><path d="M16 8v4M12 8v4"/>',
    facebook: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
};

const NOMBRES_RED = {
    web_url: 'Sitio web', discord_url: 'Discord', tienda: 'Tienda', youtube: 'YouTube', tiktok: 'TikTok',
    instagram: 'Instagram', x: 'X (Twitter)', twitch: 'Twitch', facebook: 'Facebook'
};

async function copiarTexto(texto, boton, etiquetaOriginal) {
    let ok = false;
    try {
        await navigator.clipboard.writeText(texto);
        ok = true;
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = texto;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
        ta.remove();
    }
    const span = boton.querySelector('span');
    if (span) {
        span.textContent = ok ? '¡Copiado!' : 'No se pudo';
        setTimeout(() => { span.textContent = etiquetaOriginal; }, 1800);
    }
}

const SVG_COPIAR = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

function htmlFilaConexion(etiqueta, valor) {
    return `
        <div class="conexion-fila">
            <span class="conexion-etiqueta">${etiqueta}</span>
            <span class="conexion-valor">${T.esc(valor)}</span>
            <button type="button" class="btn-pixel neutro btn-mini" data-copiar="${T.esc(valor)}" data-etiqueta="Copiar">${SVG_COPIAR}<span>Copiar</span></button>
        </div>`;
}

function crearTarjetaConexion(edicion, addon) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-conexion';
    const tipo = T.TIPO_POR_ID.servidor;
    const nombres = { java: 'Java Edition', bedrock: 'Bedrock Edition', realms: 'Realm' };
    tarjeta.style.setProperty('--cco', edicion === 'bedrock' ? '#0e7490' : edicion === 'realms' ? '#7e22ce' : tipo.osc);
    let cuerpo = '';
    let acciones = '';
    let nota = '';

    if (edicion === 'realms') {
        const enlace = T.urlSegura(addon.realm_enlace);
        cuerpo = htmlFilaConexion('Enlace', enlace || 'No disponible');
        if (enlace) {
            acciones = `<a class="btn-pixel btn-conexion" href="${T.esc(enlace)}" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg><span>Unirse al Realm</span></a>`;
        }
        nota = 'Los Realms usan un enlace de invitación en lugar de IP y puerto.';
    } else {
        const ip = addon.ip || '';
        const puerto = edicion === 'java'
            ? (addon.puerto_java || (addon.plataforma === 'java' ? addon.puerto : '') || T.PUERTO_POR_DEFECTO.java)
            : (addon.puerto_bedrock || (addon.plataforma === 'bedrock' ? addon.puerto : '') || T.PUERTO_POR_DEFECTO.bedrock);
        cuerpo = htmlFilaConexion('IP', ip) + htmlFilaConexion('Puerto', puerto);
        const completa = puerto === T.PUERTO_POR_DEFECTO.java && edicion === 'java' ? ip : ip + ':' + puerto;
        if (edicion === 'bedrock') {
            acciones = `<a class="btn-pixel btn-conexion" href="${T.esc(T.enlaceBedrock(addon.nombre, ip, puerto))}">
                <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg><span>Añadir a Minecraft</span></a>`;
            nota = `Se abrirá Minecraft Bedrock con «${T.esc(addon.nombre || 'Servidor')}» ya agregado, con su IP y puerto. Si no se abre, copia los datos y agrégalo a mano.`;
        } else {
            acciones = `<button type="button" class="btn-pixel btn-conexion" data-copiar="${T.esc(completa)}" data-etiqueta="Copiar dirección">${SVG_COPIAR}<span>Copiar dirección</span></button>`;
            nota = 'En Minecraft Java ve a Multijugador, pulsa Añadir servidor y pega la dirección.';
        }
    }

    tarjeta.innerHTML = `
        <div class="conexion-cabecera">
            <span class="chip-tipo" style="${T.estiloTipo(tipo)}">${T.svgTipo(tipo)}<span>${nombres[edicion]}</span></span>
        </div>
        ${cuerpo}
        <div class="conexion-acciones">${acciones}</div>
        <p class="nota-conexion">${nota}</p>
    `;
    tarjeta.querySelectorAll('[data-copiar]').forEach(btn => {
        btn.addEventListener('click', () => copiarTexto(btn.dataset.copiar, btn, btn.dataset.etiqueta));
    });
    return tarjeta;
}

function renderizarExtrasPorTipo(addon, idTipo) {
    const tipo = T.TIPO_POR_ID[idTipo];
    const esServidor = idTipo === 'servidor';

    const chips = [];
    chips.push(`<span class="chip-tipo" style="${T.estiloTipo(tipo)}">${T.svgTipo(tipo)}<span>${T.esc(tipo.nombre)}</span></span>`);
    if (!esServidor) {
        const pago = T.precioActivo(addon);
        chips.push(`<span class="chip-precio ${pago ? 'es-pago' : 'es-gratis'}">${T.esc(T.textoPrecio(addon))}</span>`);
        if (addon.plataforma === 'bedrock' || addon.plataforma === 'java') {
            chips.push(`<span class="chip-tipo chip-plataforma">${addon.plataforma === 'bedrock' ? 'Bedrock' : 'Java'}</span>`);
        }
    } else {
        chips.push(`<span class="chip-tipo chip-plataforma">${T.esc(T.etiquetaPlataformaServidor(addon))}</span>`);
    }
    document.getElementById('chipsView').innerHTML = chips.join('');

    document.getElementById('tituloPagina').textContent = 'Ver ' + tipo.nombre;

    if (!esServidor && T.precioActivo(addon)) {
        document.getElementById('tituloDescarga').textContent = 'Obtener (' + T.textoPrecio(addon) + ')';
    }

    const seccionServidor = document.getElementById('seccionServidor');
    const seccionRedes = document.getElementById('seccionRedes');
    seccionServidor.style.display = 'none';
    seccionRedes.style.display = 'none';
    if (!esServidor) return;

    const contenedor = document.getElementById('tarjetasConexion');
    contenedor.innerHTML = '';
    const plat = addon.plataforma || 'java';
    const multi = !!addon.multiplataforma && plat !== 'realms';
    const ediciones = [];
    if (plat === 'realms') {
        ediciones.push('realms');
    } else {
        if (plat === 'java' || multi) ediciones.push('java');
        if (plat === 'bedrock' || multi) ediciones.push('bedrock');
    }
    ediciones.forEach(ed => contenedor.appendChild(crearTarjetaConexion(ed, addon)));
    contenedor.classList.toggle('dos', ediciones.length > 1);
    seccionServidor.style.display = 'block';

    const redes = {};
    if (T.urlSegura(addon.web_url)) redes.web_url = addon.web_url;
    if (T.urlSegura(addon.discord_url)) redes.discord_url = addon.discord_url;
    let extra = {};
    try { extra = JSON.parse(addon.redes || '{}'); } catch (e) { extra = {}; }
    Object.keys(extra).forEach(k => { if (NOMBRES_RED[k] && T.urlSegura(extra[k])) redes[k] = extra[k]; });
    const claves = Object.keys(redes);
    if (claves.length > 0) {
        document.getElementById('gridRedes').innerHTML = claves.map(k => `
            <a class="btn-pixel neutro btn-red red-${k.replace('_url', '')}" href="${T.esc(redes[k])}" target="_blank" rel="noopener noreferrer nofollow">
                <svg viewBox="0 0 24 24">${ICONOS_RED[k]}</svg><span>${NOMBRES_RED[k]}</span>
            </a>
        `).join('');
        seccionRedes.style.display = 'block';
    }
}

async function renderizarView() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const contenedorError = document.getElementById('mensajeError');
    const contenedorContenido = document.getElementById('contenidoAddon');

    if (!id) {
        contenedorError.style.display = 'flex';
        contenedorContenido.style.display = 'none';
        await renderizarParaTi(null);
        await renderizarMasDescargado(null);
        return;
    }

    const addon = await obtenerAddonPorId(id);
    if (!addon) {
        contenedorError.style.display = 'flex';
        contenedorContenido.style.display = 'none';
        await renderizarParaTi(null);
        await renderizarMasDescargado(null);
        return;
    }

    document.title = addon.nombre + ' - ForgeGames';

    if (addon.nombre) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('name', addon.nombre);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    }

    contenedorError.style.display = 'none';
    contenedorContenido.style.display = 'block';

    let nombreVisibleCreador = 'Anónimo';
    let avatarUrlCreador = '';
    let creadorId = addon.user_id;
    let isVerified = false;

    if (creadorId) {
        try {
            const creador = await obtenerUsuario(creadorId);
            if (creador) {
                nombreVisibleCreador = creador.nombre_visible || creador.username || 'Anónimo';
                avatarUrlCreador = creador.avatar || '';
                isVerified = creador.verificado || false;
            }
        } catch (e) {
            console.log("Error al obtener creador:", e);
        }
    }

    document.getElementById('tituloAddon').textContent = addon.nombre || 'Sin nombre';

    const iconoAddon = document.getElementById('iconoAddon');
    iconoAddon.src = addon.portada || '../img/logo.jpg';
    iconoAddon.alt = addon.nombre || 'Icono';
    iconoAddon.onerror = function() {
        this.onerror = null;
        this.src = '../img/logo.jpg';
    };

    const bannerAddon = document.getElementById('bannerAddon');
    const bannerImg = document.getElementById('bannerImg');
    const contenedorViewEl = document.getElementById('contenedorView');
    const idTipoActual = T.tipoDe(addon);
    const imagenBanner = addon.banner || addon.portada;
    if (imagenBanner) {
        bannerImg.src = imagenBanner;
        bannerImg.alt = addon.nombre || 'Banner';
        bannerImg.onerror = function() {
            bannerAddon.style.display = 'none';
            contenedorViewEl.classList.remove('con-banner');
        };
        const textoChipBanner = idTipoActual === 'servidor' ? T.etiquetaPlataformaServidor(addon) : (addon.version || '');
        document.getElementById('bannerVersion').textContent = textoChipBanner;
        document.getElementById('bannerVersion').style.display = textoChipBanner ? '' : 'none';
        bannerAddon.style.display = 'block';
        contenedorViewEl.classList.add('con-banner');
    } else {
        bannerAddon.style.display = 'none';
        contenedorViewEl.classList.remove('con-banner');
    }

    configurarCompartir(addon);

    const avatarCreador = document.getElementById('avatarCreador');
    avatarCreador.src = avatarUrlCreador || '';
    avatarCreador.alt = nombreVisibleCreador;
    avatarCreador.onerror = function() {
        this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    };

    const nombreCreador = document.getElementById('nombreCreador');
    nombreCreador.textContent = nombreVisibleCreador;
    nombreCreador.addEventListener('click', () => {
        if (creadorId) {
            window.location.href = rutasNavegacionAndEnlacesMcpixel.profileView + '?id=' + creadorId;
        }
    });

    const badgeVerificado = document.getElementById('badgeVerificado');
    if (isVerified) {
        badgeVerificado.classList.add('visible');
    } else {
        badgeVerificado.classList.remove('visible');
    }

    let likes = parseInt(addon.likes) || 0;
    if (likes < 0) likes = 0;
    document.getElementById('meGustasStat').textContent = formatearNumero(likes);
    document.getElementById('descargasContador').textContent = formatearNumero(addon.descargas || 0);
    document.getElementById('descargasMeta').textContent = formatearNumero(addon.descargas || 0) + ' descargas';

    const fechaPub = addon.fecha ? new Date(addon.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Desconocida';
    document.getElementById('fechaPublicacion').textContent = fechaPub;
    const fechaAct = addon.created_at ? new Date(addon.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : fechaPub;
    document.getElementById('fechaActualizacion').textContent = fechaAct;
    document.getElementById('actualizadoMeta').textContent = 'Actualizado ' + tiempoRelativo(addon.created_at || addon.fecha);

    if (idTipoActual === 'servidor') {
        document.getElementById('statDescargasLabel').textContent = 'Plataforma';
        document.getElementById('descargasContador').textContent = T.etiquetaPlataformaServidor(addon);
        document.getElementById('descargasContador').closest('.stat-item').querySelector('svg').innerHTML = '<rect x="2" y="3" width="20" height="7" rx="1"/><rect x="2" y="14" width="20" height="7" rx="1"/><path d="M6 6.5h.01M6 17.5h.01"/>';
        document.getElementById('descargasMeta').style.display = 'none';
    }
    renderizarExtrasPorTipo(addon, idTipoActual);

    const etiquetas = (addon.etiquetas || '').split(',').map(e => e.trim()).filter(e => e);
    const contenedorEtiquetas = document.getElementById('etiquetasAddon');
    contenedorEtiquetas.innerHTML = '';
    etiquetas.forEach(et => {
        const enlaceEtiqueta = document.createElement('a');
        enlaceEtiqueta.className = 'btn-pixel etiqueta';
        enlaceEtiqueta.href = rutasNavegacionAndEnlacesMcpixel.explorar + '?q=' + encodeURIComponent(et);
        enlaceEtiqueta.textContent = '#' + et;
        contenedorEtiquetas.appendChild(enlaceEtiqueta);
    });

    const descripcionHtml = procesarDescripcion(addon.descripcion || '');
    const descripcionEl = document.getElementById('descripcionAddon');
    const bloqueDescripcion = document.getElementById('descripcionBloque');
    const btnVerMas = document.getElementById('btnVerMas');
    descripcionEl.innerHTML = descripcionHtml;
    descripcionEl.classList.add('colapsada');
    btnVerMas.textContent = 'Ver más';
    btnVerMas.style.display = 'none';
    bloqueDescripcion.style.display = descripcionHtml ? 'block' : 'none';
    requestAnimationFrame(() => {
        if (descripcionEl.scrollHeight > descripcionEl.clientHeight + 2) {
            btnVerMas.style.display = 'inline-block';
        }
    });
    btnVerMas.onclick = () => {
        const colapsada = descripcionEl.classList.toggle('colapsada');
        btnVerMas.textContent = colapsada ? 'Ver más' : 'Ver menos';
    };

    const filaDescarga = document.getElementById('filaDescarga');
    const btnPrincipal = document.getElementById('btnDescargaPrincipal');
    const btnAlternativas = document.getElementById('btnAlternativas');
    const menuAlternativas = document.getElementById('menuAlternativas');
    const listaAlternativas = document.getElementById('listaAlternativas');
    listaAlternativas.innerHTML = '';
    let botonesDescarga = [];
    try {
        botonesDescarga = JSON.parse(addon.botones_descarga || '[]');
    } catch (e) {
        botonesDescarga = [];
    }
    if (!Array.isArray(botonesDescarga)) botonesDescarga = [];
    botonesDescarga = botonesDescarga.slice(0, 3);

    if (T.ventaPorContacto(addon)) {
        filaDescarga.parentElement.style.display = 'block';
        const tituloDesc = document.getElementById('tituloDescarga');
        if (tituloDesc) tituloDesc.textContent = 'Comprar';
        btnPrincipal.href = '#';
        btnPrincipal.removeAttribute('target');
        btnPrincipal.querySelector('span').textContent = 'Comprar · ' + T.textoPrecio(addon);
        btnPrincipal.onclick = (e) => { e.preventDefault(); abrirContactoVenta(addon); };
        btnAlternativas.style.display = 'none';
        menuAlternativas.style.display = 'none';
    } else if (botonesDescarga.length === 0) {
        filaDescarga.parentElement.style.display = 'none';
    } else {
        filaDescarga.parentElement.style.display = 'block';
        const principal = botonesDescarga[0];
        btnPrincipal.href = principal.url || '#';
        btnPrincipal.target = '_blank';
        btnPrincipal.rel = 'noopener';
        btnPrincipal.onclick = (e) => manejarDescarga(e, addon, principal);

        const alternativas = botonesDescarga.slice(1);
        if (!currentUser) {
            btnPrincipal.href = rutasNavegacionAndEnlacesMcpixel.login;
            btnPrincipal.removeAttribute('target');
            btnPrincipal.classList.add('requiere-sesion');
            const textoBtn = btnPrincipal.querySelector('span');
            if (textoBtn) textoBtn.textContent = 'Inicia sesión para descargar';
            btnPrincipal.onclick = (e) => { e.preventDefault(); pedirSesionParaDescargar(); };
            btnAlternativas.style.display = 'none';
            menuAlternativas.style.display = 'none';
            const aviso = document.getElementById('avisoDescargaSesion');
            if (aviso) aviso.remove();
            const nota = document.createElement('p');
            nota.id = 'avisoDescargaSesion';
            nota.className = 'aviso-descarga-sesion';
            nota.innerHTML = 'Necesitas una cuenta para descargar. <a href="' + rutasNavegacionAndEnlacesMcpixel.login + '">Iniciar sesión</a> o <a href="' + rutasNavegacionAndEnlacesMcpixel.register + '">crear cuenta</a>.';
            nota.querySelectorAll('a').forEach(a => a.addEventListener('click', guardarRutaDeRetorno));
            filaDescarga.parentElement.appendChild(nota);
        } else if (alternativas.length === 0) {
            btnAlternativas.style.display = 'none';
            menuAlternativas.style.display = 'none';
        } else {
            btnAlternativas.style.display = 'inline-flex';
            menuAlternativas.style.display = 'block';
            alternativas.forEach((boton, i) => {
                const a = document.createElement('a');
                a.className = 'item-alternativa';
                a.href = boton.url || '#';
                a.target = '_blank';
                a.rel = 'noopener';

                const icono = document.createElement('div');
                icono.className = 'item-alternativa-icono';
                icono.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

                const texto = document.createElement('div');
                texto.className = 'item-alternativa-texto';
                const nombre = document.createElement('span');
                nombre.className = 'item-alternativa-nombre';
                nombre.textContent = boton.nombre || 'Descargar';
                const sub = document.createElement('span');
                sub.className = 'item-alternativa-sub';
                sub.textContent = 'Alternativa ' + (i + 1);
                texto.appendChild(nombre);
                texto.appendChild(sub);

                const flecha = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                flecha.setAttribute('viewBox', '0 0 24 24');
                flecha.setAttribute('class', 'item-alternativa-flecha');
                flecha.innerHTML = '<path d="M7 17L17 7"/><polyline points="7 7 17 7 17 17"/>';

                a.appendChild(icono);
                a.appendChild(texto);
                a.appendChild(flecha);
                a.addEventListener('click', (e) => manejarDescarga(e, addon, boton));
                listaAlternativas.appendChild(a);
            });

            btnAlternativas.onclick = (e) => {
                e.stopPropagation();
                const abierto = menuAlternativas.classList.toggle('abierto');
                btnAlternativas.setAttribute('aria-expanded', abierto ? 'true' : 'false');
            };
        }
    }

    const imagenes = [];
    T.videosDe(addon).forEach(v => imagenes.push({ tipo: 'video', video: v }));
    T.listaJson(addon.referencias).forEach(ref => imagenes.push({ tipo: 'imagen', src: ref }));

    let indiceActual = 0;
    const contenedorPrincipal = document.getElementById('contenedorPrincipal');
    const thumbnailsContainer = document.getElementById('galeriaThumbnails');
    const flechaIzq = document.getElementById('flechaIzq');
    const flechaDer = document.getElementById('flechaDer');

    function renderizarPrincipal(indice) {
        contenedorPrincipal.innerHTML = '';
        const item = imagenes[indice];
        if (!item) return;
        if (item.tipo === 'video') {
            const v = item.video;
            if (v.tipo === 'youtube' || v.tipo === 'vimeo') {
                const iframe = document.createElement('iframe');
                iframe.src = v.embed;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
                iframe.allowFullscreen = true;
                contenedorPrincipal.appendChild(iframe);
            } else if (v.tipo === 'archivo') {
                const video = document.createElement('video');
                video.src = v.src;
                video.controls = true;
                video.playsInline = true;
                video.preload = 'metadata';
                contenedorPrincipal.appendChild(video);
            } else {
                const caja = document.createElement('div');
                caja.className = 'video-enlace';
                caja.innerHTML = '<span>Este video está en otra página.</span>' +
                    '<a class="btn-pixel amarillo" target="_blank" rel="noopener noreferrer" href="' + T.esc(v.url) + '">' +
                    '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Abrir video</span></a>';
                contenedorPrincipal.appendChild(caja);
            }
        } else {
            const fondo = document.createElement('div');
            fondo.className = 'galeria-fondo';
            fondo.style.backgroundImage = 'url("' + String(item.src).replace(/"/g, '%22') + '")';
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = 'Imagen';
            img.onerror = function() { this.style.display = 'none'; };
            contenedorPrincipal.appendChild(fondo);
            contenedorPrincipal.appendChild(img);
        }
        actualizarThumbnails(indice);
    }

    function actualizarThumbnails(indice) {
        thumbnailsContainer.innerHTML = '';
        imagenes.forEach((item, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'thumb' + (i === indice ? ' activo' : '');
            if (item.tipo === 'video') {
                const miniatura = item.video.miniatura || '';
                thumb.innerHTML = `
                    <img src="${T.esc(miniatura)}" alt="Video" onerror="this.style.visibility='hidden'">
                    <div class="thumb-play"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg></div>
                `;
            } else {
                thumb.innerHTML = `<img src="${T.esc(item.src)}" alt="Miniatura" onerror="this.style.display='none'">`;
            }
            thumb.addEventListener('click', () => {
                indiceActual = i;
                renderizarPrincipal(indiceActual);
            });
            thumbnailsContainer.appendChild(thumb);
        });
    }

    if (imagenes.length > 0) {
        renderizarPrincipal(0);
    } else {
        contenedorPrincipal.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--texto-secundario);">Sin imágenes</div>';
    }

    flechaIzq.addEventListener('click', () => {
        if (imagenes.length === 0) return;
        indiceActual = (indiceActual - 1 + imagenes.length) % imagenes.length;
        renderizarPrincipal(indiceActual);
    });
    flechaDer.addEventListener('click', () => {
        if (imagenes.length === 0) return;
        indiceActual = (indiceActual + 1) % imagenes.length;
        renderizarPrincipal(indiceActual);
    });

    const btnMeGusta = document.getElementById('btnMeGusta');
    if (currentUser && userLikes[addon.id]) {
        btnMeGusta.classList.add('activo');
    }
    btnMeGusta.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Inicia sesión para dar me gusta.');
            return;
        }
        if (btnMeGusta.dataset.ocupado) return;
        btnMeGusta.dataset.ocupado = '1';
        const ya = userLikes[addon.id] || false;
        try {
            const res = ya
                ? await mcDB.from('likes').delete().eq('user_id', currentUser.id).eq('addon_id', addon.id)
                : await mcDB.from('likes').insert({ user_id: currentUser.id, addon_id: addon.id });
            if (res.error && res.error.code !== '23505') throw res.error;

            userLikes[addon.id] = !ya;
            btnMeGusta.classList.toggle('activo', !ya);
            let likes = (parseInt(addon.likes) || 0) + (ya ? -1 : 1);
            if (likes < 0) likes = 0;
            addon.likes = likes;
            document.getElementById('meGustasStat').textContent = formatearNumero(likes);
            mcDB.cache.borrar('likes:');
            mcDB.cache.borrar('addon:' + addon.id);
        } catch (e) {
            console.log("Error al actualizar like:", e);
        } finally {
            delete btnMeGusta.dataset.ocupado;
        }
    });

    const btnFavorito = document.getElementById('btnFavorito');
    if (currentUser && userFavorites[addon.id]) {
        btnFavorito.classList.add('activo');
    }
    btnFavorito.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Inicia sesión para guardar en favoritos.');
            return;
        }
        if (btnFavorito.dataset.ocupado) return;
        btnFavorito.dataset.ocupado = '1';
        const ya = userFavorites[addon.id] || false;
        try {
            const res = ya
                ? await mcDB.from('favorites').delete().eq('user_id', currentUser.id).eq('addon_id', addon.id)
                : await mcDB.from('favorites').insert({ user_id: currentUser.id, addon_id: addon.id });
            if (res.error && res.error.code !== '23505') throw res.error;

            userFavorites[addon.id] = !ya;
            btnFavorito.classList.toggle('activo', !ya);
            mcDB.cache.borrar('favorites:');
        } catch (e) {
            console.log("Error al actualizar favorito:", e);
        } finally {
            delete btnFavorito.dataset.ocupado;
        }
    });

    await renderizarParaTi(addon.id);
    await renderizarMasDescargado(addon.id);
}

const perfilBtn = document.getElementById('perfilBtn');
const sidebarMenu = document.getElementById('sidebarMenu');
const toggleCollapseBtn = document.getElementById('toggleCollapseBtn');
const cuerpo = document.body;

function inicializarPantalla() {
    if (window.innerWidth >= 768) {
        const estadoGuardado = localStorage.getItem('mcpixel_interfaz_v2_sidebar_pc');
        if (estadoGuardado === 'minimizado') {
            cuerpo.classList.remove('sidebar-abierto-pc');
            cuerpo.classList.add('sidebar-minimizado-pc');
        } else {
            cuerpo.classList.remove('sidebar-minimizado-pc');
            cuerpo.classList.add('sidebar-abierto-pc');
        }
        sidebarMenu.classList.remove('activo');
    } else {
        cuerpo.classList.remove('sidebar-abierto-pc', 'sidebar-minimizado-pc');
        sidebarMenu.classList.remove('activo');
    }
}

perfilBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.innerWidth >= 768) {
        if (cuerpo.classList.contains('sidebar-minimizado-pc')) {
            cuerpo.classList.remove('sidebar-minimizado-pc');
            cuerpo.classList.add('sidebar-abierto-pc');
            localStorage.setItem('mcpixel_interfaz_v2_sidebar_pc', 'abierto');
        }
    } else {
        sidebarMenu.classList.toggle('activo');
    }
});

toggleCollapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.innerWidth >= 768) {
        if (cuerpo.classList.contains('sidebar-abierto-pc')) {
            cuerpo.classList.remove('sidebar-abierto-pc');
            cuerpo.classList.add('sidebar-minimizado-pc');
            localStorage.setItem('mcpixel_interfaz_v2_sidebar_pc', 'minimizado');
        } else {
            cuerpo.classList.remove('sidebar-minimizado-pc');
            cuerpo.classList.add('sidebar-abierto-pc');
            localStorage.setItem('mcpixel_interfaz_v2_sidebar_pc', 'abierto');
        }
    }
});

sidebarMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});

document.addEventListener('click', (e) => {
    if (window.innerWidth < 768) {
        sidebarMenu.classList.remove('activo');
    }
    if (!e.target.closest('#filaDescarga')) {
        cerrarMenuAlternativas();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cerrarMenuAlternativas();
        cerrarModalCompartir();
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        sidebarMenu.classList.remove('activo');
        const estadoGuardado = localStorage.getItem('mcpixel_interfaz_v2_sidebar_pc');
        if (estadoGuardado === 'minimizado') {
            cuerpo.classList.remove('sidebar-abierto-pc');
            cuerpo.classList.add('sidebar-minimizado-pc');
        } else {
            cuerpo.classList.remove('sidebar-minimizado-pc');
            cuerpo.classList.add('sidebar-abierto-pc');
        }
    } else {
        cuerpo.classList.remove('sidebar-abierto-pc', 'sidebar-minimizado-pc');
    }
});

const paraTiIzq = document.getElementById('paraTiIzq');
const paraTiDer = document.getElementById('paraTiDer');
const scrollParaTi = document.getElementById('scrollParaTi');

paraTiIzq.addEventListener('click', () => {
    scrollParaTi.scrollBy({ left: -280, behavior: 'smooth' });
});

paraTiDer.addEventListener('click', () => {
    scrollParaTi.scrollBy({ left: 280, behavior: 'smooth' });
});

const masDescargadoIzq = document.getElementById('masDescargadoIzq');
const masDescargadoDer = document.getElementById('masDescargadoDer');
const scrollMasDescargado = document.getElementById('scrollMasDescargado');

masDescargadoIzq.addEventListener('click', () => {
    scrollMasDescargado.scrollBy({ left: -280, behavior: 'smooth' });
});

masDescargadoDer.addEventListener('click', () => {
    scrollMasDescargado.scrollBy({ left: 280, behavior: 'smooth' });
});

(async function iniciarApp() {
    inicializarPantalla();
    await verificarSesion();
    await renderizarView();
})();
