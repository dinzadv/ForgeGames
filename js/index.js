const manifestObject = {
    "name": "ForgeGames",
    "short_name": "ForgeGames",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0b0c10",
    "theme_color": "#0b0c10",
    "icons": [
        {
            "src": "img/logo.jpg",
            "sizes": "512x512",
            "type": "image/jpeg"
        }
    ]
};
const manifestBlob = new Blob([JSON.stringify(manifestObject)], { type: 'application/json' });
const manifestURL = URL.createObjectURL(manifestBlob);
document.getElementById('manifestPlaceholder').setAttribute('href', manifestURL);

if ('serviceWorker' in navigator) {
    const swCode = `
        const CACHE_NAME = 'mcpixel-v1';
        self.addEventListener('install', (e) => {
            self.skipWaiting();
        });
        self.addEventListener('activate', (e) => {
            e.waitUntil(clients.claim());
        });
        self.addEventListener('fetch', (e) => {
            e.respondWith(
                fetch(e.request).catch(() => caches.match(e.request))
            );
        });
    `;
    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    const swURL = URL.createObjectURL(swBlob);
    navigator.serviceWorker.register(swURL).catch(() => {});
}

function verificarEstadoRed() {
    const pantallaOffline = document.getElementById('pantallaOffline');
    if (!navigator.onLine) {
        pantallaOffline.classList.add('activa');
    } else {
        pantallaOffline.classList.remove('activa');
    }
}

window.addEventListener('online', verificarEstadoRed);
window.addEventListener('offline', verificarEstadoRed);
document.getElementById('btnReintentarOffline').addEventListener('click', () => {
    verificarEstadoRed();
    if (navigator.onLine) {
        window.location.reload();
    }
});



const TABLE_USERS = 'users';
const TABLE_ADDONS = 'addons';
const TABLE_LIKES = 'likes';
const BUCKET_PORTADAS = 'portadas';
const BUCKET_AVATARS = 'avatars';

const rutasNavegacionAndEnlacesMcpixel = {
    login: "login/",
    register: "register/",
    inicio: "./",
    explorar: "explore/",
    profile: "profile/",
    view: "view/",
    post: "post/",
    favorites: "favorites/"
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

let currentUser = null;
let userLikes = {};

function obtenerUrlImagen(filePath, bucket = BUCKET_PORTADAS) {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    const { data } = mcDB.storage.from(bucket).getPublicUrl(filePath);
    return data ? data.publicUrl : '';
}

function aplicarCargaImagen(imgElement, parentContainer) {
    parentContainer.classList.add('img-placeholder-skeleton');
    if (imgElement.complete && imgElement.naturalHeight !== 0) {
        parentContainer.classList.remove('img-placeholder-skeleton');
        imgElement.classList.add('cargado');
    } else {
        imgElement.onload = () => {
            parentContainer.classList.remove('img-placeholder-skeleton');
            imgElement.classList.add('cargado');
        };
        imgElement.onerror = () => {
            parentContainer.classList.remove('img-placeholder-skeleton');
            imgElement.style.display = 'none';
        };
    }
}

async function verificarSesionYBloquearPublicar() {
    try {
        const { data: { session } } = await mcDB.auth.getSession();
        if (!session || !session.user) throw new Error("No hay sesión activa");

        const sessionUser = session.user;
        currentUser = sessionUser;
        document.getElementById('contenedorAutenticacion').style.display = 'none';

        const elementosBloqueados = ['menuLinkPerfil', 'menuLinkFavoritos'];
        elementosBloqueados.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('deshabilitado');
            }
        });


        try {
            const doc = await mcDB.obtenerPerfil(sessionUser.id);

            if (doc && doc.avatar) {
                const avatarUrl = obtenerUrlImagen(doc.avatar, BUCKET_AVATARS);
                const contenedorPerfil = document.getElementById('perfilBtn');
                contenedorPerfil.innerHTML = `<img src="${McShared.esc(avatarUrl)}" alt="Avatar" class="perfil-img-activa">`;
            }
        } catch (e) {
            console.log("Error al obtener el avatar:", e);
        }

        await obtenerLikesUsuario();

    } catch (error) {
        document.getElementById('contenedorAutenticacion').style.display = 'flex';

        const elementosBloquear = ['menuLinkPerfil', 'menuLinkFavoritos'];
        elementosBloquear.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('deshabilitado');
            }
        });
    }
}

async function obtenerLikesUsuario() {
    if (!currentUser) return;
    try {
        userLikes = await mcDB.idsDe(TABLE_LIKES, currentUser.id);
    } catch (e) {
        console.log("Error al obtener likes del usuario:", e);
    }
}

// La lista se guarda en localStorage unos minutos (ver js/db.js) para no pedirla en cada visita
async function obtenerAddonsPublicados(forzar = false) {
    try {
        return await mcDB.listarAddons(forzar);
    } catch (e) {
        return [];
    }
}

function escaparHtml(texto) {
    return String(texto == null ? '' : texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fechaAddon(addon, vacio = 'Fecha desconocida') {
    const bruta = addon.fecha || addon.created_at;
    if (!bruta) return vacio;
    const d = new Date(bruta);
    if (isNaN(d.getTime())) return vacio;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ICONO_LIKE = '<svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
const ICONO_DESCARGA = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
const ICONO_RELOJ = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
const ICONO_GRID = '<svg viewBox="0 0 24 24"><path d="M4 5h7v7H4zm10 0h7v7h-7zM4 14h7v7H4zm10 0h7v7h-7z"/></svg>';

function crearTarjetaPremium(addon) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-premium-addon';
    tarjeta.innerHTML = McShared.cardInterior(addon, { usarBanner: true });
    aplicarCargaImagen(tarjeta.querySelector('.addon-premium-img'), tarjeta.querySelector('.addon-premium-cabecera'));
    tarjeta.addEventListener('click', () => {
        window.location.href = rutasNavegacionAndEnlacesMcpixel.view + '?id=' + (addon.id || addon.addonId);
    });
    return tarjeta;
}

function formatearNumero(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function crearMensajeVacio(contenedor) {
    contenedor.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'mensaje-vacio-categoria';
    div.innerHTML = `
        <img src="img/icons/ic1.gif" alt="Sin complementos" class="icono-vacio-gif">
        <span>No hay complementos disponibles</span>
        <span class="sub">Vuelve más tarde, la comunidad está creando contenido increíble</span>
    `;
    contenedor.appendChild(div);
}

function renderizarTarjetas(contenedor, addons, limite, mostrarLikes) {
    contenedor.innerHTML = '';
    if (!addons || addons.length === 0) {
        crearMensajeVacio(contenedor);
        return;
    }
    const items = limite ? addons.slice(0, limite) : addons;
    items.forEach(addon => {
        const tarjeta = document.createElement('div');
        if (mostrarLikes) {
            tarjeta.className = 'tarjeta-valorada';
        } else {
            tarjeta.className = 'tarjeta-viendo';
        }
        const fecha = addon.fecha ? new Date(addon.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : (addon.created_at ? new Date(addon.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Fecha desconocida');
        tarjeta.setAttribute('data-descargas', addon.descargas || '0');
        tarjeta.setAttribute('data-version', addon.version || '1.0.0');
        tarjeta.setAttribute('data-fecha', fecha);
        tarjeta.setAttribute('data-likes', addon.likes || addon.meGustas || 0);
        tarjeta.setAttribute('data-descripcion', addon.descripcion || '');

        let likesHtml = '';
        if (mostrarLikes) {
            const likes = addon.likes || addon.meGustas || 0;
            likesHtml = `<div class="tag-likes" title="Me gusta"><svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg><span>${formatearNumero(likes)}</span></div>`;
        }

        const imagenTarjeta = addon.banner || addon.portada;
        const portadaUrl = imagenTarjeta ? obtenerUrlImagen(imagenTarjeta, BUCKET_PORTADAS) : '';

        const tipoCarrusel = McShared.TIPO_POR_ID[McShared.tipoDe(addon)];
        tarjeta.innerHTML = `
            ${likesHtml}
            <div class="chip-tipo tarjeta-tipo" style="${McShared.estiloTipo(tipoCarrusel)}">${McShared.svgTipo(tipoCarrusel)}<span>${tipoCarrusel.nombre}</span></div>
            <img src="${escaparHtml(portadaUrl)}" alt="${escaparHtml(addon.nombre || 'Addon')}" class="viendo-img">
            <div class="viendo-overlay"><h4 class="viendo-titulo">${escaparHtml(addon.nombre || 'Sin nombre')}</h4></div>
        `;
        const imgEl = tarjeta.querySelector('.viendo-img');
        aplicarCargaImagen(imgEl, tarjeta);

        tarjeta.addEventListener('click', () => {
            window.location.href = rutasNavegacionAndEnlacesMcpixel.view + '?id=' + (addon.id || addon.addonId);
        });
        contenedor.appendChild(tarjeta);
    });
}

const TAGS_BANNER = {
    descargado: {
        texto: 'Más descargado',
        clase: 'tag-descargado',
        icono: ICONO_DESCARGA
    },
    valorado: {
        texto: 'Mejor valorado',
        clase: 'tag-valorado',
        icono: ICONO_LIKE
    },
    nuevo: {
        texto: 'Nuevo',
        clase: 'tag-nuevo',
        icono: '<svg viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M17 5h4"/></svg>'
    },
    recomendado: {
        texto: 'Recomendado',
        clase: 'tag-recomendado',
        icono: '<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>'
    },
    destacado: {
        texto: 'Destacado',
        clase: 'tag-destacado',
        icono: '<svg viewBox="0 0 24 24"><polygon points="12 2 15.1 8.6 22 9.6 17 14.5 18.2 21.5 12 18.2 5.8 21.5 7 14.5 2 9.6 8.9 8.6 12 2"/></svg>'
    }
};

async function renderizarBanners() {
    const addons = await obtenerAddonsPublicados();
    const pistes = document.getElementById('carruselPistas');
    const nav = document.getElementById('carruselNav');
    pistes.innerHTML = '';
    nav.innerHTML = '';

    if (!addons || addons.length === 0) {
        document.getElementById('carruselSeccionPrincipal').classList.add('oculto');
        return;
    }

    document.getElementById('carruselSeccionPrincipal').classList.remove('oculto');

    let candidatos = [];
    let idsUsados = new Set();

    let masDescargado = [...addons].sort((a, b) => (parseInt(b.descargas) || 0) - (parseInt(a.descargas) || 0))[0];
    if (masDescargado) {
        candidatos.push({ addon: masDescargado, tag: 'descargado' });
        idsUsados.add(masDescargado.id || masDescargado.addonId);
    }

    let mejorValorado = [...addons].filter(a => !idsUsados.has(a.id || a.addonId)).sort((a, b) => (parseInt(b.likes || b.meGustas) || 0) - (parseInt(a.likes || a.meGustas) || 0))[0];
    if (mejorValorado) {
        candidatos.push({ addon: mejorValorado, tag: 'valorado' });
        idsUsados.add(mejorValorado.id || mejorValorado.addonId);
    }

    let nuevo = [...addons].filter(a => !idsUsados.has(a.id || a.addonId)).sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha) : (a.created_at ? new Date(a.created_at) : new Date(0));
        const fechaB = b.fecha ? new Date(b.fecha) : (b.created_at ? new Date(b.created_at) : new Date(0));
        return fechaB - fechaA;
    })[0];
    if (nuevo) {
        candidatos.push({ addon: nuevo, tag: 'nuevo' });
        idsUsados.add(nuevo.id || nuevo.addonId);
    }

    let disponibles = addons.filter(a => !idsUsados.has(a.id || a.addonId)).sort(() => Math.random() - 0.5);

    if (disponibles.length > 0) {
        let recomendacion = disponibles.pop();
        candidatos.push({ addon: recomendacion, tag: 'recomendado' });
        idsUsados.add(recomendacion.id || recomendacion.addonId);
    }

    if (disponibles.length > 0) {
        let otro = disponibles.pop();
        candidatos.push({ addon: otro, tag: 'destacado' });
        idsUsados.add(otro.id || otro.addonId);
    }

    if (candidatos.length < 5) {
        let restantes = addons.filter(a => !idsUsados.has(a.id || a.addonId)).sort(() => Math.random() - 0.5);
        const tagsDisponibles = ['descargado', 'valorado', 'nuevo', 'recomendado', 'destacado'];
        while (candidatos.length < 5 && restantes.length > 0) {
            let item = restantes.pop();
            let tagUsado = tagsDisponibles[candidatos.length % tagsDisponibles.length];
            candidatos.push({ addon: item, tag: tagUsado });
            idsUsados.add(item.id || item.addonId);
        }
    }

    const banners = candidatos.slice(0, 5);
    banners.forEach((itemObj, index) => {
        const addon = itemObj.addon;
        const item = document.createElement('div');
        item.className = 'banner-item';
        item.style.width = '20%';
        const imagenBanner = addon.banner || addon.portada;
        const portadaUrl = imagenBanner ? obtenerUrlImagen(imagenBanner, BUCKET_PORTADAS) : '';
        const infoTag = TAGS_BANNER[itemObj.tag] || TAGS_BANNER.destacado;
        const likesBanner = addon.likes || addon.meGustas || 0;
        item.innerHTML = `
            <img src="${escaparHtml(portadaUrl)}" alt="Banner" class="banner-img">
            <div class="banner-overlay">
                <span class="banner-tag ${infoTag.clase}">${infoTag.icono}<span>${infoTag.texto}</span></span>
                <h2 class="banner-titulo">${escaparHtml(addon.nombre || 'Addon')}</h2>
                <p class="banner-descripcion">${escaparHtml(addon.descripcion || 'Descubre este increíble complemento para tu mundo.')}</p>
                <div class="banner-chips">
                    <div class="addon-badge-votos" title="Me gusta">${ICONO_LIKE}<span>${formatearNumero(likesBanner)}</span></div>
                    ${McShared.tipoDe(addon) === 'servidor'
                        ? `<div class="addon-premium-meta-item meta-descargas meta-ip" title="Dirección del servidor">${McShared.iconos.servidor}<span>${escaparHtml(McShared.textoIp(addon) || 'Servidor')}</span></div>`
                        : `<div class="addon-premium-meta-item meta-descargas" title="Descargas">${ICONO_DESCARGA}<span>${formatearNumero(addon.descargas || 0)}</span></div>`}
                </div>
            </div>
        `;
        const imgEl = item.querySelector('.banner-img');
        aplicarCargaImagen(imgEl, item);

        item.addEventListener('click', () => {
            window.location.href = rutasNavegacionAndEnlacesMcpixel.view + '?id=' + (addon.id || addon.addonId);
        });
        pistes.appendChild(item);
    });

    for (let i = 0; i < banners.length; i++) {
        const indicador = document.createElement('button');
        indicador.classList.add('carrusel-indicador');
        if (i === 0) indicador.classList.add('activo');
        indicador.addEventListener('click', () => cambiarBanner(i, banners.length));
        nav.appendChild(indicador);
    }

    window.bannerTotal = banners.length;
    window.bannerActual = 0;
    if (window.carruselInterval) clearInterval(window.carruselInterval);
    window.carruselInterval = setInterval(() => {
        let prox = (window.bannerActual + 1) % window.bannerTotal;
        cambiarBanner(prox, window.bannerTotal);
    }, 6000);
}

function cambiarBanner(indice, total) {
    const pistes = document.getElementById('carruselPistas');
    const indicadores = document.querySelectorAll('.carrusel-indicador');
    window.bannerActual = indice;
    pistes.style.transform = `translateX(-${indice * 20}%)`;
    indicadores.forEach((ind, i) => {
        if (i === indice) ind.classList.add('activo');
        else ind.classList.remove('activo');
    });
}

async function renderizarSecciones() {
    const addons = await obtenerAddonsPublicados();

    const seccionRecientes = document.getElementById('seccionRecientes');
    const seccionValorados = document.getElementById('seccionValorados');
    const seccionRecomendados = document.getElementById('seccionRecomendados');
    const mensajeVacio = document.getElementById('mensajeInicioVacio');

    if (!addons || addons.length === 0) {
        seccionRecientes.classList.add('oculto');
        seccionValorados.classList.add('oculto');
        McShared.TIPOS.forEach(t => document.getElementById('seccionTipo' + t.id.charAt(0).toUpperCase() + t.id.slice(1)).classList.add('oculto'));
        seccionRecomendados.classList.add('oculto');
        mensajeVacio.style.display = 'flex';
        return;
    } else {
        mensajeVacio.style.display = 'none';
    }

    const recientes = [...addons].sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha) : (a.created_at ? new Date(a.created_at) : new Date(0));
        const fechaB = b.fecha ? new Date(b.fecha) : (b.created_at ? new Date(b.created_at) : new Date(0));
        return fechaB - fechaA;
    });

    seccionRecientes.classList.remove('oculto');
    renderizarTarjetas(document.getElementById('scrollRecientes'), recientes, 10, false);

    const valorados = [...addons].sort((a, b) => {
        const likesA = parseInt(a.likes || a.meGustas) || 0;
        const likesB = parseInt(b.likes || b.meGustas) || 0;
        return likesB - likesA;
    });

    seccionValorados.classList.remove('oculto');
    renderizarTarjetas(document.getElementById('scrollValorados'), valorados, 10, true);

    McShared.TIPOS.forEach(t => {
        const sufijo = t.id.charAt(0).toUpperCase() + t.id.slice(1);
        const seccion = document.getElementById('seccionTipo' + sufijo);
        const lista = ordenarAddons(addons.filter(a => McShared.tipoDe(a) === t.id), 'recientes');
        if (lista.length === 0) {
            seccion.classList.add('oculto');
        } else {
            seccion.classList.remove('oculto');
            renderizarTarjetas(document.getElementById('scrollTipo' + sufijo), lista, 10, false);
        }
    });

    const recomendados = [...addons].sort(() => Math.random() - 0.5);

    if (recomendados.length === 0) {
        seccionRecomendados.classList.add('oculto');
    } else {
        seccionRecomendados.classList.remove('oculto');
        renderizarTarjetas(document.getElementById('scrollRecomendados'), recomendados, 10, false);
    }
}

async function compilarTodosLosAddons() {
    const contenedor = document.getElementById('contenedorGridTodos');
    const addons = await obtenerAddonsPublicados();
    contenedor.innerHTML = '';

    if (!addons || addons.length === 0) {
        const div = document.createElement('div');
        div.className = 'mensaje-vacio-categoria';
        div.style.gridColumn = '1 / -1';
        div.innerHTML = `
            <img src="img/icons/ic1.gif" alt="Sin complementos" class="icono-vacio-gif">
            <span>No hay complementos disponibles</span>
            <span class="sub">Sé el primero en publicar un complemento</span>
        `;
        contenedor.appendChild(div);
        return;
    }

    const mezclados = [...addons].sort(() => Math.random() - 0.5);
    mezclados.forEach(addon => contenedor.appendChild(crearTarjetaPremium(addon)));
}

/* ===================== Categorías ===================== */
const CATEGORIAS = McShared.TIPOS.map(t => ({
    id: t.catId, tipo: t.id, nombre: t.plural, desc: t.desc,
    c: t.c, osc: t.osc, t: t.t, icono: t.icono
}));

function perteneceACategoria(addon, catId) {
    const cat = CATEGORIAS.find(c => c.id === catId);
    return !!cat && McShared.tipoDe(addon) === cat.tipo;
}

function contarPorCategoria(addons) {
    const cuentas = {};
    CATEGORIAS.forEach(c => { cuentas[c.id] = 0; });
    (addons || []).forEach(a => {
        const cat = CATEGORIAS.find(c => c.tipo === McShared.tipoDe(a));
        if (cat) cuentas[cat.id]++;
    });
    return cuentas;
}

function svgCategoria(cat) {
    return '<svg viewBox="0 0 24 24">' + cat.icono + '</svg>';
}

function estiloCategoria(cat) {
    return '--cc:' + cat.c + ';--cco:' + cat.osc + ';--ct:' + cat.t;
}

function textoCuenta(n) {
    if (n === 0) return 'Sin publicaciones';
    return n === 1 ? '1 publicación' : n + ' publicaciones';
}

function ordenarAddons(lista, orden) {
    const copia = [...lista];
    const fecha = a => {
        const d = new Date(a.fecha || a.created_at || 0);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    };
    if (orden === 'descargados') {
        copia.sort((a, b) => (parseInt(b.descargas) || 0) - (parseInt(a.descargas) || 0));
    } else if (orden === 'valorados') {
        copia.sort((a, b) => (parseInt(b.likes || b.meGustas) || 0) - (parseInt(a.likes || a.meGustas) || 0));
    } else {
        copia.sort((a, b) => fecha(b) - fecha(a));
    }
    return copia;
}

async function renderizarCategorias() {
    const grid = document.getElementById('gridCategorias');
    const addons = await obtenerAddonsPublicados();
    const cuentas = contarPorCategoria(addons);
    grid.innerHTML = CATEGORIAS.map(cat => `
        <button type="button" class="tarjeta-categoria ${cuentas[cat.id] === 0 ? 'sin-contenido' : ''}" data-cat="${cat.id}" style="${estiloCategoria(cat)}">
            <span class="categoria-icono">${svgCategoria(cat)}</span>
            <span class="categoria-textos">
                <span class="categoria-nombre">${cat.nombre}</span>
                <span class="categoria-desc">${cat.desc}</span>
            </span>
            <span class="categoria-cuenta">${textoCuenta(cuentas[cat.id])}</span>
        </button>
    `).join('');
    grid.querySelectorAll('[data-cat]').forEach(el => {
        el.addEventListener('click', () => irACategoria(el.dataset.cat));
    });
}

async function renderizarChipsCategoriasHome() {
    const fila = document.getElementById('filaCategoriasRapidas');
    const cont = document.getElementById('chipsCategoriasHome');
    const addons = await obtenerAddonsPublicados();
    if (!addons.length) {
        fila.classList.add('oculto');
        return;
    }
    const cuentas = contarPorCategoria(addons);
    const chips = CATEGORIAS.filter(c => cuentas[c.id] > 0).map(cat => `
        <button type="button" class="chip-pixel" data-cat="${cat.id}" style="${estiloCategoria(cat)}">${svgCategoria(cat)}<span>${cat.nombre}</span></button>
    `);
    chips.push(`<button type="button" class="chip-pixel chip-acento" id="chipTodasCategorias">${ICONO_GRID}<span>Ver todas</span></button>`);
    cont.innerHTML = chips.join('');
    cont.querySelectorAll('[data-cat]').forEach(el => {
        el.addEventListener('click', () => irACategoria(el.dataset.cat));
    });
    document.getElementById('chipTodasCategorias').addEventListener('click', () => {
        location.hash = 'categorias';
    });
    fila.classList.remove('oculto');
}

const ORDENES_CATEGORIA = [
    { id: 'recientes', nombre: 'Recientes' },
    { id: 'descargados', nombre: 'Más descargados' },
    { id: 'valorados', nombre: 'Mejor valorados' }
];
let ordenCategoria = 'recientes';
let categoriaAbierta = null;

async function pintarGridCategoria() {
    const cat = CATEGORIAS.find(c => c.id === categoriaAbierta);
    if (!cat) return;
    const addons = await obtenerAddonsPublicados();
    const lista = ordenarAddons(addons.filter(a => perteneceACategoria(a, cat.id)), ordenCategoria);
    const grid = document.getElementById('gridCategoriaDetalle');
    grid.innerHTML = '';
    if (lista.length === 0) {
        const div = document.createElement('div');
        div.className = 'mensaje-vacio-categoria';
        div.style.gridColumn = '1 / -1';
        div.innerHTML = `
            <img src="img/icons/ic1.gif" alt="Sin complementos" class="icono-vacio-gif">
            <span>Aún no hay publicaciones en ${cat.nombre}</span>
            <span class="sub">Publica el primero o prueba con otra categoría.</span>
        `;
        grid.appendChild(div);
        return;
    }
    lista.forEach(addon => grid.appendChild(crearTarjetaPremium(addon)));
}

async function renderizarDetalleCategoria(id) {
    const cat = CATEGORIAS.find(c => c.id === id);
    if (!cat) return;
    if (categoriaAbierta !== id) ordenCategoria = 'recientes';
    categoriaAbierta = id;

    const addons = await obtenerAddonsPublicados();
    const cuentas = contarPorCategoria(addons);

    const cab = document.getElementById('categoriaDetalleCabecera');
    cab.setAttribute('style', estiloCategoria(cat));
    cab.innerHTML = `
        <span class="categoria-icono">${svgCategoria(cat)}</span>
        <div>
            <h3>${cat.nombre}</h3>
            <p>${cat.desc}</p>
            <span class="categoria-cuenta" style="margin-top:8px;">${textoCuenta(cuentas[cat.id])}</span>
        </div>
    `;

    const chips = document.getElementById('chipsCambioCategoria');
    chips.innerHTML = CATEGORIAS.map(c => `
        <button type="button" class="chip-pixel ${c.id === id ? 'activo' : ''}" data-cat="${c.id}" style="${estiloCategoria(c)}">${svgCategoria(c)}<span>${c.nombre}</span></button>
    `).join('');
    chips.querySelectorAll('[data-cat]').forEach(el => {
        el.addEventListener('click', () => irACategoria(el.dataset.cat));
    });
    const chipActivo = chips.querySelector('.activo');
    if (chipActivo) chips.scrollLeft = Math.max(0, chipActivo.offsetLeft - 16);

    const barra = document.getElementById('barraOrden');
    barra.innerHTML = '<span class="etiqueta-orden">Ordenar por</span>' + ORDENES_CATEGORIA.map(o => `
        <button type="button" class="chip-pixel chip-orden ${o.id === ordenCategoria ? 'activo' : ''}" data-orden="${o.id}">${o.nombre}</button>
    `).join('');
    barra.querySelectorAll('[data-orden]').forEach(el => {
        el.addEventListener('click', () => {
            ordenCategoria = el.dataset.orden;
            barra.querySelectorAll('[data-orden]').forEach(b => b.classList.toggle('activo', b === el));
            pintarGridCategoria();
        });
    });

    await pintarGridCategoria();
}

/* ===================== Vistas y navegación ===================== */
let vistaActual = 'inicio';

async function cambiarVista(vista, opts = {}) {
    vistaActual = vista;
    const esInicio = vista === 'inicio';
    const esTodos = vista === 'todos';
    const esCategorias = vista === 'categorias' || vista === 'categoria';

    vistasContenidoInicio.style.display = esInicio ? 'block' : 'none';
    seccionDinamicaTodos.classList.toggle('activo', esTodos);
    seccionCategorias.classList.toggle('activo', esCategorias);
    document.getElementById('vistaCategoriasLista').style.display = vista === 'categorias' ? 'block' : 'none';
    document.getElementById('vistaCategoriaDetalle').style.display = vista === 'categoria' ? 'block' : 'none';

    btnBurbujaInicio.classList.toggle('activo', esInicio);
    btnBurbujaVerTodos.classList.toggle('activo', esTodos);

    document.getElementById('menuLinkInicio').classList.toggle('activo-link', esInicio || esTodos);
    const enlacesTipo = { modelos: 'menuLinkModelos', sprites: 'menuLinkSprites', servidores: 'menuLinkServidores' };
    document.getElementById('menuLinkCategorias').classList.toggle('activo-link', vista === 'categorias' || (vista === 'categoria' && !enlacesTipo[opts.id]));
    Object.keys(enlacesTipo).forEach(idCat => {
        const enlace = document.getElementById(enlacesTipo[idCat]);
        if (enlace) enlace.classList.toggle('activo-link', vista === 'categoria' && opts.id === idCat);
    });

    const carruselNavRef = document.getElementById('carruselNav');
    if (carruselNavRef) carruselNavRef.classList.toggle('oculto', !esInicio);
    if (!esInicio && window.carruselInterval) clearInterval(window.carruselInterval);

    if (!opts.inicial) window.scrollTo({ top: 0, behavior: 'smooth' });

    if (esInicio) {
        await renderizarBanners();
        await renderizarSecciones();
        await renderizarChipsCategoriasHome();
    } else if (esTodos) {
        await compilarTodosLosAddons();
    } else if (vista === 'categorias') {
        await renderizarCategorias();
    } else if (vista === 'categoria') {
        await renderizarDetalleCategoria(opts.id);
    }
}

function destinoDesdeHash() {
    let h = '';
    try {
        h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    } catch (e) {
        return null;
    }
    if (h === 'categorias') return { vista: 'categorias' };
    if (h.startsWith('categoria-')) {
        const id = h.slice('categoria-'.length);
        if (CATEGORIAS.some(c => c.id === id)) return { vista: 'categoria', id };
    }
    return null;
}

function limpiarHash() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
}

function irACategoria(id) {
    location.hash = 'categoria-' + id;
}

function irAInicio() {
    limpiarHash();
    if (vistaActual === 'inicio') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    cambiarVista('inicio');
}

async function aplicarHash() {
    if (window.innerWidth < 768) sidebarMenu.classList.remove('activo');
    const destino = destinoDesdeHash();
    if (destino) {
        await cambiarVista(destino.vista, destino);
    } else if (vistaActual === 'categorias' || vistaActual === 'categoria') {
        await cambiarVista('inicio');
    }
}

document.querySelectorAll('.url-ver-mas-ref').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        if (el.dataset.destino) {
            location.hash = el.dataset.destino;
        } else {
            limpiarHash();
            cambiarVista('todos');
        }
    });
});

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

document.addEventListener('click', () => {
    if (window.innerWidth < 768) {
        sidebarMenu.classList.remove('activo');
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

document.querySelectorAll('.bloque-carrusel-horizontal').forEach(bloque => {
    const scrollContenedorActual = bloque.querySelector('.scroll-carrusel');
    const btnIzq = bloque.querySelector('.pc-flecha-izq');
    const btnDer = bloque.querySelector('.pc-flecha-der');

    if (scrollContenedorActual && btnIzq && btnDer) {
        btnIzq.addEventListener('click', () => {
            scrollContenedorActual.scrollBy({ left: -300, behavior: 'smooth' });
        });
        btnDer.addEventListener('click', () => {
            scrollContenedorActual.scrollBy({ left: 300, behavior: 'smooth' });
        });
    }
});

const btnBurbujaInicio = document.getElementById('burbujaInicio');
const btnBurbujaVerTodos = document.getElementById('burbujaVerTodos');
const vistasContenidoInicio = document.getElementById('vistasContenidoInicio');
const seccionDinamicaTodos = document.getElementById('seccionTodosLosAddons');
const seccionCategorias = document.getElementById('seccionCategorias');

btnBurbujaInicio.addEventListener('click', irAInicio);

btnBurbujaVerTodos.addEventListener('click', () => {
    limpiarHash();
    cambiarVista('todos');
});

document.getElementById('menuLinkInicio').addEventListener('click', (e) => {
    e.preventDefault();
    if (window.innerWidth < 768) sidebarMenu.classList.remove('activo');
    irAInicio();
});

document.getElementById('btnVolverCategorias').addEventListener('click', () => {
    location.hash = 'categorias';
});

window.addEventListener('hashchange', aplicarHash);

(async function iniciarApp() {
    verificarEstadoRed();
    inicializarPantalla();
    await verificarSesionYBloquearPublicar();
    const destino = destinoDesdeHash();
    if (destino) {
        await cambiarVista(destino.vista, { ...destino, inicial: true });
    } else {
        await cambiarVista('inicio', { inicial: true });
    }
})();
