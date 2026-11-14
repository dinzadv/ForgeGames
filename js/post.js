const rutasNavegacionAndEnlacesMcpixel = {
    login: "../login/",
    register: "../register/",
    inicio: "../",
    explorar: "../explore/",
    profile: "../profile/",
    post: "../post/",
    view: "../view/"
};

document.getElementById('btnAuthLoginMenu').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.login);
document.getElementById('btnAuthRegistroMenu').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.register);
document.getElementById('menuLinkInicio').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.inicio);
document.getElementById('menuLinkExplorar').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.explorar);
document.getElementById('menuLinkPerfil').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.profile);

let currentUser = null;

async function verificarSesion() {
    try {
        const { data: { session } } = await mcDB.auth.getSession();

        if (!session) {
            window.location.href = rutasNavegacionAndEnlacesMcpixel.login;
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
    } catch (error) {
        window.location.href = rutasNavegacionAndEnlacesMcpixel.login;
    }
}

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

const perfilBtn = document.getElementById('perfilBtn');
const sidebarMenu = document.getElementById('sidebarMenu');
const toggleCollapseBtn = document.getElementById('toggleCollapseBtn');
const cuerpo = document.body;

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

/* ====================== Formulario por tipos ====================== */
const T = window.McShared;
const MAX_REFERENCIAS = 6;
const MAX_VIDEOS = 5;
const MAXIMO_BOTONES_DESCARGA = 3;
const idEdicion = new URLSearchParams(window.location.search).get('id');
let addonEdicion = null;

const estado = {
    tipo: 'addon',
    portada: null,
    banner: null,
    referencias: [],
    plataformaAddon: null,
    plataformaServidor: 'java',
    multiplataforma: false,
    precioActivo: false
};

const TEXTOS = {
    addon: {
        titulo: 'Publica tu Add-On', nombre: 'Nombre del Add-On', ph: 'Ej. Motosierras y Demonios Addon',
        desc: 'Describe de qué trata tu add-on, sus características y cómo funciona...',
        etiquetas: 'Ej. armas, criaturas, magia', boton: 'Publicar Add-On'
    },
    modelo: {
        titulo: 'Publica tu Modelo', nombre: 'Nombre del Modelo', ph: 'Ej. Dragón Medieval 3D',
        desc: 'Cuéntanos qué incluye tu modelo, para qué sirve y cómo usarlo...',
        etiquetas: 'Ej. dragón, medieval, mobiliario', boton: 'Publicar Modelo'
    },
    sprites: {
        titulo: 'Publica tus Menús y Sprites', nombre: 'Nombre del pack', ph: 'Ej. Menú Pixel Oscuro',
        desc: 'Explica qué pantallas, iconos o sprites incluye y cómo se instalan...',
        etiquetas: 'Ej. menú, inventario, hud, iconos', boton: 'Publicar Menús y Sprites'
    },
    servidor: {
        titulo: 'Publica tu Servidor', nombre: 'Nombre del Servidor', ph: 'Ej. PixelCraft Network',
        desc: 'Cuenta de qué trata tu servidor, modalidades, reglas y qué lo hace especial...',
        etiquetas: 'Ej. survival, skyblock, minijuegos, español', boton: 'Publicar Servidor'
    }
};

const REDES = [
    { id: 'web_url', nombre: 'Sitio web', ph: 'https://miservidor.net', tipo: 'web' },
    { id: 'discord_url', nombre: 'Discord', ph: 'https://discord.gg/tuinvitacion', tipo: 'discord' },
    { id: 'tienda', nombre: 'Tienda', ph: 'https://tienda.miservidor.net', tipo: 'web' },
    { id: 'youtube', nombre: 'YouTube', ph: 'https://youtube.com/@canal', tipo: 'web' },
    { id: 'tiktok', nombre: 'TikTok', ph: 'https://tiktok.com/@usuario', tipo: 'web' },
    { id: 'instagram', nombre: 'Instagram', ph: 'https://instagram.com/usuario', tipo: 'web' },
    { id: 'x', nombre: 'X (Twitter)', ph: 'https://x.com/usuario', tipo: 'web' },
    { id: 'twitch', nombre: 'Twitch', ph: 'https://twitch.tv/usuario', tipo: 'web' },
    { id: 'facebook', nombre: 'Facebook', ph: 'https://facebook.com/pagina', tipo: 'web' }
];

const MONEDA_POR_REGION = {
    US: 'USD', MX: 'MXN', AR: 'ARS', CO: 'COP', CL: 'CLP', PE: 'PEN', BR: 'BRL', VE: 'VES', UY: 'UYU', BO: 'BOB',
    PY: 'PYG', DO: 'DOP', GT: 'GTQ', CR: 'CRC', HN: 'HNL', NI: 'NIO', PA: 'PAB', CU: 'CUP', GB: 'GBP', CA: 'CAD',
    AU: 'AUD', CH: 'CHF', JP: 'JPY', KR: 'KRW', CN: 'CNY', IN: 'INR', ID: 'IDR', PH: 'PHP', TR: 'TRY', PL: 'PLN',
    RU: 'RUB', ES: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', PT: 'EUR'
};

const el = (id) => document.getElementById(id);
const selectorTipo = el('selectorTipo');
const inputNombre = el('inputNombreAddon');
const inputDescripcion = el('inputDescripcionAddon');
const inputEtiquetas = el('inputEtiquetas');
const inputVersionMc = el('inputVersionMc');
const inputVersionServidor = el('inputVersionServidor');
const btnPublicar = el('btnPublicarAddon');
const mensajePost = el('mensajePost');
let faltantes = [];

function mostrarMensaje(texto) {
    mensajePost.textContent = texto || '';
    mensajePost.classList.toggle('visible', !!texto);
}

/* ---------- Selector de tipo ---------- */
function renderizarSelectorTipo() {
    selectorTipo.innerHTML = T.TIPOS.map(t => `
        <button type="button" class="tipo-opcion ${t.id === estado.tipo ? 'seleccionado' : ''}" data-tipo="${t.id}"
            style="--tc:${t.c};--tco:${t.osc};--tt:${t.t}" ${idEdicion ? 'disabled' : ''}>
            <span class="tipo-icono">${T.svgTipo(t)}</span>
            <span class="tipo-nombre">${t.nombre}</span>
            <span class="tipo-desc">${t.desc}</span>
        </button>
    `).join('');
    selectorTipo.querySelectorAll('.tipo-opcion').forEach(btn => {
        btn.addEventListener('click', () => {
            if (idEdicion) return;
            estado.tipo = btn.dataset.tipo;
            renderizarSelectorTipo();
            aplicarTipo();
        });
    });
}

function aplicarTipo() {
    const t = estado.tipo;
    document.querySelectorAll('[data-tipos]').forEach(nodo => {
        nodo.hidden = !nodo.dataset.tipos.split(' ').includes(t);
    });
    const tx = TEXTOS[t];
    el('tituloPost').textContent = idEdicion ? 'Editar publicación' : tx.titulo;
    el('tituloHeaderPost').textContent = idEdicion ? 'Editar' : 'Publicar';
    el('subtituloPost').textContent = idEdicion
        ? 'Actualiza la información y guarda los cambios.'
        : 'Completa la información para compartir tu creación con la comunidad de ForgeGames.';
    el('etiquetaNombre').textContent = tx.nombre;
    inputNombre.placeholder = tx.ph;
    inputDescripcion.placeholder = tx.desc;
    inputEtiquetas.placeholder = tx.etiquetas;
    btnPublicar.textContent = idEdicion ? 'Guardar cambios' : tx.boton;

    // Mecánicas propias de cada tipo
    const soloAddon = t === 'addon';
    el('opcionalVersion').hidden = soloAddon;
    el('opcionalPlataforma').hidden = soloAddon;
    actualizarDescargaOpcional();
    if (t === 'servidor') aplicarPlataformaServidor();
    validar();
}

/* ---------- Zonas de imagen ---------- */
function configurarZona(zona, input, preview, btnQuitar, clave, ajustes) {
    zona.addEventListener('click', () => input.click());
    input.addEventListener('change', async (e) => {
        const archivo = e.target.files && e.target.files[0];
        input.value = '';
        if (!archivo) return;
        zona.classList.add('cargando');
        try {
            const url = await mcDB.imagenADataURL(archivo, ajustes);
            estado[clave] = url;
            preview.src = url;
            zona.classList.add('tiene-imagen');
            mostrarMensaje('');
        } catch (err) {
            mostrarMensaje(err.message);
        } finally {
            zona.classList.remove('cargando');
            validar();
        }
    });
    btnQuitar.addEventListener('click', (e) => {
        e.stopPropagation();
        estado[clave] = null;
        preview.src = '';
        zona.classList.remove('tiene-imagen');
        validar();
    });
}

function pintarZona(zona, preview, url) {
    if (url) {
        preview.src = url;
        zona.classList.add('tiene-imagen');
    } else {
        preview.src = '';
        zona.classList.remove('tiene-imagen');
    }
}

const zonaPortada = el('zonaPortada');
const previewPortada = el('previewPortada');
const zonaBanner = el('zonaBanner');
const previewBanner = el('previewBanner');
configurarZona(zonaPortada, el('inputPortada'), previewPortada, el('btnQuitarPortada'), 'portada', mcDB.ajustes.portadas);
configurarZona(zonaBanner, el('inputBanner'), previewBanner, el('btnQuitarBanner'), 'banner', mcDB.ajustes.banners);

/* ---------- Imágenes adicionales ---------- */
const zonaReferencias = el('zonaReferencias');
const inputReferencias = el('inputReferencias');
const scrollReferencias = el('scrollReferencias');

zonaReferencias.addEventListener('click', () => {
    if (estado.referencias.length >= MAX_REFERENCIAS) return;
    inputReferencias.click();
});

inputReferencias.addEventListener('change', async (e) => {
    const archivos = Array.from(e.target.files || []).slice(0, MAX_REFERENCIAS - estado.referencias.length);
    inputReferencias.value = '';
    for (const archivo of archivos) {
        try {
            estado.referencias.push(await mcDB.imagenADataURL(archivo, mcDB.ajustes.galeria));
            renderizarReferencias();
        } catch (err) {
            mostrarMensaje(err.message);
        }
    }
    validar();
});

function renderizarReferencias() {
    scrollReferencias.innerHTML = '';
    estado.referencias.forEach((src, indice) => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-referencia';
        tarjeta.innerHTML = `
            <div class="tarjeta-referencia-orden">${indice + 1}</div>
            <div class="tarjeta-referencia-eliminar" data-indice="${indice}">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <img src="${McShared.esc(src)}" alt="Imagen ${indice + 1}">
        `;
        scrollReferencias.appendChild(tarjeta);
    });
    scrollReferencias.querySelectorAll('.tarjeta-referencia-eliminar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            estado.referencias.splice(parseInt(btn.dataset.indice, 10), 1);
            renderizarReferencias();
            validar();
        });
    });
    el('contadorReferencias').textContent = estado.referencias.length + ' / ' + MAX_REFERENCIAS;
    el('carruselReferenciasEnvoltura').classList.toggle('activo', estado.referencias.length > 0);
    zonaReferencias.classList.toggle('deshabilitada', estado.referencias.length >= MAX_REFERENCIAS);
}

/* ---------- Videos (URL) ---------- */
const listaVideos = el('listaVideos');
const btnAgregarVideo = el('btnAgregarVideo');

function describirVideo(valor) {
    if (!valor.trim()) return { clase: '', texto: '' };
    const v = T.parsearVideo(valor);
    if (!v) return { clase: 'mal', texto: 'No parece una URL válida (debe empezar con https://).' };
    if (v.tipo === 'youtube') return { clase: 'ok', texto: 'Video de YouTube detectado.' };
    if (v.tipo === 'vimeo') return { clase: 'ok', texto: 'Video de Vimeo detectado.' };
    if (v.tipo === 'archivo') return { clase: 'ok', texto: 'Archivo de video directo detectado.' };
    return { clase: '', texto: 'Enlace externo: se mostrará como botón para abrir el video.' };
}

function crearFilaVideo(valorInicial) {
    if (listaVideos.children.length >= MAX_VIDEOS) return;
    const fila = document.createElement('div');
    fila.className = 'fila-video';
    fila.innerHTML = `
        <div class="fila-video-campo">
            <input type="text" class="input-texto-base campo-video" autocapitalize="none" placeholder="https://www.youtube.com/watch?v=...">
            <span class="pista-video"></span>
        </div>
        <button type="button" class="btn-eliminar-descarga" aria-label="Quitar video">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
    `;
    listaVideos.appendChild(fila);
    const campo = fila.querySelector('.campo-video');
    const pista = fila.querySelector('.pista-video');
    if (valorInicial) campo.value = valorInicial;
    const actualizar = () => {
        const d = describirVideo(campo.value);
        pista.className = 'pista-video ' + d.clase;
        pista.textContent = d.texto;
        campo.classList.toggle('invalido', d.clase === 'mal');
        validar();
    };
    campo.addEventListener('input', actualizar);
    fila.querySelector('.btn-eliminar-descarga').addEventListener('click', () => {
        fila.remove();
        btnAgregarVideo.classList.toggle('oculto', listaVideos.children.length >= MAX_VIDEOS);
        validar();
    });
    actualizar();
    btnAgregarVideo.classList.toggle('oculto', listaVideos.children.length >= MAX_VIDEOS);
}
btnAgregarVideo.addEventListener('click', () => crearFilaVideo());

function recolectarVideos() {
    return Array.from(listaVideos.querySelectorAll('.campo-video')).map(c => c.value.trim()).filter(Boolean);
}

/* ---------- Plataforma (Add-On / Modelo / Sprites) ---------- */
const btnBedrock = el('btnPlataformaBedrock');
const btnJava = el('btnPlataformaJava');
btnBedrock.addEventListener('click', () => {
    const ya = btnBedrock.classList.contains('seleccionado');
    btnBedrock.classList.toggle('seleccionado', !ya);
    btnJava.classList.remove('seleccionado');
    estado.plataformaAddon = ya ? null : 'bedrock';
    validar();
});
btnJava.addEventListener('click', () => {
    const ya = btnJava.classList.contains('seleccionado');
    btnJava.classList.toggle('seleccionado', !ya);
    btnBedrock.classList.remove('seleccionado');
    estado.plataformaAddon = ya ? null : 'java';
    validar();
});

/* ---------- Botones de descarga ---------- */
const listaBotonesDescarga = el('listaBotonesDescarga');
const btnAgregarDescarga = el('btnAgregarDescarga');

function nombreEsInvalido(valor) {
    const texto = valor.trim();
    if (texto === '') return false;
    if (/https?:\/\//i.test(texto)) return true;
    return /\.(com|net|org|io|gg|co|es|mx|app|dev|html|php|info|xyz|me|link)$/i.test(texto);
}

function urlEsInvalida(valor) {
    const texto = valor.trim();
    return texto !== '' && !/^https?:\/\/[^\s]+$/i.test(texto);
}

function crearFilaBotonDescarga(urlInicial, nombreInicial) {
    if (listaBotonesDescarga.children.length >= MAXIMO_BOTONES_DESCARGA) return;
    const fila = document.createElement('div');
    fila.className = 'fila-boton-descarga';
    fila.innerHTML = `
        <div class="fila-boton-descarga-campo">
            <input type="text" class="input-texto-base campo-url-descarga" autocapitalize="none" placeholder="URL de descarga">
            <span class="mensaje-error-campo campo-url-error">El enlace debe ser una URL válida.</span>
        </div>
        <div class="fila-boton-descarga-campo">
            <input type="text" class="input-texto-base campo-nombre-descarga" placeholder="Nombre del botón">
            <span class="mensaje-error-campo campo-nombre-error">Nombre inválido, no uses http(s):// ni extensiones de dominio.</span>
        </div>
        <button type="button" class="btn-eliminar-descarga" aria-label="Quitar botón">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
    `;
    listaBotonesDescarga.appendChild(fila);
    const campoUrl = fila.querySelector('.campo-url-descarga');
    const campoNombre = fila.querySelector('.campo-nombre-descarga');
    if (urlInicial) campoUrl.value = urlInicial;
    if (nombreInicial) campoNombre.value = nombreInicial;
    campoUrl.addEventListener('input', () => {
        const mal = urlEsInvalida(campoUrl.value);
        campoUrl.classList.toggle('invalido', mal);
        fila.querySelector('.campo-url-error').classList.toggle('visible', mal);
        validar();
    });
    campoNombre.addEventListener('input', () => {
        const mal = nombreEsInvalido(campoNombre.value);
        campoNombre.classList.toggle('invalido', mal);
        fila.querySelector('.campo-nombre-error').classList.toggle('visible', mal);
        validar();
    });
    fila.querySelector('.btn-eliminar-descarga').addEventListener('click', () => {
        fila.remove();
        btnAgregarDescarga.classList.toggle('oculto', listaBotonesDescarga.children.length >= MAXIMO_BOTONES_DESCARGA);
        validar();
    });
    btnAgregarDescarga.classList.toggle('oculto', listaBotonesDescarga.children.length >= MAXIMO_BOTONES_DESCARGA);
    validar();
}
btnAgregarDescarga.addEventListener('click', () => crearFilaBotonDescarga());

function recolectarBotonesDescarga() {
    return Array.from(listaBotonesDescarga.querySelectorAll('.fila-boton-descarga')).map(fila => ({
        url: fila.querySelector('.campo-url-descarga').value.trim(),
        nombre: fila.querySelector('.campo-nombre-descarga').value.trim()
    })).filter(b => b.url && b.nombre);
}

/* ---------- Interruptores estilo Minecraft ---------- */
function pintarToggle(btn, activo, textoOn, textoOff) {
    btn.setAttribute('aria-checked', activo ? 'true' : 'false');
    btn.querySelector('.mc-toggle-estado').textContent = activo ? (textoOn || 'SÍ') : (textoOff || 'NO');
}

const togglePrecio = el('togglePrecio');
const inputPrecio = el('inputPrecio');
const selectMoneda = el('selectMoneda');

selectMoneda.innerHTML = T.MONEDAS.map(m =>
    `<option value="${m[0]}">${m[0]} — ${m[1]} (${m[2]})</option>`).join('');
(function monedaPorDefecto() {
    const idioma = (navigator.language || 'es-MX').split('-');
    const region = (idioma[1] || '').toUpperCase();
    selectMoneda.value = MONEDA_POR_REGION[region] || 'USD';
})();

function actualizarDescargaOpcional() {
    const pago = !!estado.precioActivo && estado.tipo !== 'servidor';
    el('opcionalDescarga').hidden = estado.tipo === 'addon' && !pago;
    el('notaDescargaPago').hidden = !pago;
}

function aplicarPrecio() {
    pintarToggle(togglePrecio, estado.precioActivo);
    actualizarDescargaOpcional();
    el('bloquePrecio').hidden = !estado.precioActivo;
    el('bloqueContacto').hidden = !estado.precioActivo;
    el('ayudaPrecio').textContent = estado.precioActivo
        ? 'Indica cuánto cuesta y en qué moneda. Se mostrará junto a tu publicación.'
        : 'Desactivado: tu publicación se mostrará como Free.';
    validar();
}
togglePrecio.addEventListener('click', () => {
    estado.precioActivo = !estado.precioActivo;
    aplicarPrecio();
});
inputPrecio.addEventListener('input', validar);
const inputContactoWhatsapp = el('inputContactoWhatsapp');
const inputContactoDiscord = el('inputContactoDiscord');
inputContactoWhatsapp.addEventListener('input', validar);
inputContactoDiscord.addEventListener('input', validar);

function whatsappDigitos() {
    return inputContactoWhatsapp.value.replace(/\D/g, '');
}
function whatsappValido() {
    const d = whatsappDigitos();
    return d.length >= 8 && d.length <= 15;
}

function leerPrecio() {
    const n = parseFloat(inputPrecio.value.replace(',', '.'));
    return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

/* ---------- Servidor ---------- */
const inputIp = el('inputIp');
const inputPuerto = el('inputPuerto');
const inputPuertoExtra = el('inputPuertoExtra');
const inputRealm = el('inputRealm');
const toggleMulti = el('toggleMultiplataforma');

function puertoDefecto(plat) {
    return T.PUERTO_POR_DEFECTO[plat] || '';
}

function aplicarPlataformaServidor() {
    const p = estado.plataformaServidor;
    document.querySelectorAll('#selectorPlataformaServidor .segmento-largo').forEach(b => {
        const activo = b.dataset.plat === p;
        b.classList.toggle('seleccionado', activo);
        b.setAttribute('aria-checked', activo ? 'true' : 'false');
    });
    const esRealm = p === 'realms';
    el('bloqueDireccion').hidden = esRealm || estado.tipo !== 'servidor';
    el('bloqueRealm').hidden = !esRealm || estado.tipo !== 'servidor';
    toggleMulti.hidden = esRealm || estado.tipo !== 'servidor';
    if (esRealm) estado.multiplataforma = false;

    if (!esRealm) {
        inputPuerto.placeholder = puertoDefecto(p);
        const otro = p === 'java' ? 'bedrock' : 'java';
        el('etiquetaPuertoExtra').textContent = 'Puerto de ' + (otro === 'java' ? 'Java' : 'Bedrock');
        inputPuertoExtra.placeholder = puertoDefecto(otro);
        el('textoMultiplataforma').textContent = p === 'java'
            ? 'Multiplataforma (también entra Bedrock)'
            : 'Multiplataforma (también entra Java)';
    }
    pintarToggle(toggleMulti, estado.multiplataforma);
    el('bloquePuertoExtra').hidden = !(estado.multiplataforma && !esRealm);
    validar();
}

document.querySelectorAll('#selectorPlataformaServidor .segmento-largo').forEach(b => {
    b.addEventListener('click', () => {
        estado.plataformaServidor = b.dataset.plat;
        aplicarPlataformaServidor();
    });
});
toggleMulti.addEventListener('click', () => {
    estado.multiplataforma = !estado.multiplataforma;
    aplicarPlataformaServidor();
});

function normalizarIp(valor) {
    return valor.trim().replace(/^[a-z]+:\/\//i, '').replace(/\/+$/, '');
}

function ipEsValida(valor) {
    return /^(?=.{3,253}$)[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(valor);
}

function puertoEsValido(valor) {
    if (valor.trim() === '') return true;
    const n = Number(valor);
    return /^\d+$/.test(valor.trim()) && n >= 1 && n <= 65535;
}

// Si pegan "ip:puerto" en el campo de la IP, se separan solos
inputIp.addEventListener('blur', () => {
    const limpio = normalizarIp(inputIp.value);
    const m = limpio.match(/^([^:\s]+):(\d{1,5})$/);
    if (m) {
        inputIp.value = m[1];
        inputPuerto.value = m[2];
    } else {
        inputIp.value = limpio;
    }
    validar();
});

el('redesGrid').innerHTML = REDES.map(r => `
    <div class="campo-red">
        <div class="campo-etiqueta"><span>${r.nombre}</span></div>
        <input type="text" class="input-texto-base campo-red-input" data-red="${r.id}" data-tipo-red="${r.tipo}" autocapitalize="none" placeholder="${r.ph}">
        <span class="mensaje-error-campo">${r.tipo === 'discord' ? 'Pega un enlace de Discord válido (discord.gg/...).' : 'Debe ser una URL válida (https://...).'}</span>
    </div>
`).join('');

function redEsInvalida(input) {
    const v = input.value.trim();
    if (!v) return false;
    if (!/^https?:\/\/[^\s]+$/i.test(v)) return true;
    if (input.dataset.tipoRed === 'discord') return !/discord(\.gg|\.com|app\.com)/i.test(v);
    return false;
}

el('redesGrid').querySelectorAll('.campo-red-input').forEach(inp => {
    inp.addEventListener('input', () => {
        const mal = redEsInvalida(inp);
        inp.classList.toggle('invalido', mal);
        inp.nextElementSibling.classList.toggle('visible', mal);
        validar();
    });
});

/* ---------- Validación ---------- */
function evaluar() {
    const falta = [];
    const t = estado.tipo;
    if (!estado.portada) falta.push('la imagen de portada');
    if (!inputNombre.value.trim()) falta.push('el nombre');
    if (!inputDescripcion.value.trim()) falta.push('la descripción');
    if (!inputEtiquetas.value.trim()) falta.push('las etiquetas');
    if (recolectarVideos().some(v => !T.parsearVideo(v))) falta.push('una URL de video válida');

    if (t === 'servidor') {
        if (estado.plataformaServidor === 'realms') {
            if (!T.urlSegura(inputRealm.value)) falta.push('el enlace de invitación del Realm');
            el('errorRealm').classList.toggle('visible', inputRealm.value.trim() !== '' && !T.urlSegura(inputRealm.value));
        } else {
            const ip = normalizarIp(inputIp.value);
            const ipOk = ipEsValida(ip) && !/:/.test(ip);
            if (!ipOk) falta.push('la IP del servidor');
            el('errorIp').classList.toggle('visible', inputIp.value.trim() !== '' && !ipOk && !/^[^:\s]+:\d{1,5}$/.test(ip));
            const pOk = puertoEsValido(inputPuerto.value);
            if (!pOk) falta.push('un puerto válido');
            el('errorPuerto').classList.toggle('visible', !pOk);
            if (estado.multiplataforma) {
                const pxOk = puertoEsValido(inputPuertoExtra.value);
                if (!pxOk) falta.push('el segundo puerto válido');
                el('errorPuertoExtra').classList.toggle('visible', !pxOk);
            }
        }
        if (Array.from(document.querySelectorAll('.campo-red-input')).some(redEsInvalida)) falta.push('revisar los enlaces de redes');
    } else {
        if (t === 'addon') {
            if (!inputVersionMc.value.trim()) falta.push('la versión de Minecraft');
            if (!estado.plataformaAddon) falta.push('la plataforma');
        }
        let hayBotonIncompleto = false;
        // En publicaciones de pago la URL de descarga no es necesaria (se vende por contacto)
        if (!estado.precioActivo) listaBotonesDescarga.querySelectorAll('.fila-boton-descarga').forEach(fila => {
            const u = fila.querySelector('.campo-url-descarga').value.trim();
            const n = fila.querySelector('.campo-nombre-descarga').value.trim();
            if ((u || n) && (!u || !n || urlEsInvalida(u) || nombreEsInvalido(n))) hayBotonIncompleto = true;
        });
        if (hayBotonIncompleto) falta.push('completar los botones de descarga');
        if (t === 'addon' && !estado.precioActivo && recolectarBotonesDescarga().length === 0) falta.push('al menos un botón de descarga');
        if (estado.precioActivo) {
            const ok = leerPrecio() > 0;
            el('errorPrecio').classList.toggle('visible', inputPrecio.value.trim() !== '' && !ok);
            if (!ok) falta.push('el precio');
            const hayWa = inputContactoWhatsapp.value.trim() !== '';
            const waOk = whatsappValido();
            el('errorContactoWhatsapp').classList.toggle('visible', hayWa && !waOk);
            const dcOk = inputContactoDiscord.value.trim() !== '';
            if ((hayWa && !waOk) || (!waOk && !dcOk)) falta.push('un contacto de ventas (WhatsApp o Discord)');
        }
    }
    return falta;
}

function validar() {
    faltantes = evaluar();
    btnPublicar.classList.toggle('habilitado', faltantes.length === 0);
    if (faltantes.length === 0) mostrarMensaje('');
}

[inputNombre, inputDescripcion, inputEtiquetas, inputVersionMc, inputVersionServidor, inputIp, inputPuerto, inputPuertoExtra, inputRealm].forEach(c => {
    c.addEventListener('input', validar);
});

/* ---------- Publicar / Guardar ---------- */
function construirRegistro() {
    const t = estado.tipo;
    const reg = {
        tipo: t,
        nombre: inputNombre.value.trim(),
        descripcion: inputDescripcion.value.trim(),
        etiquetas: inputEtiquetas.value.trim(),
        portada: estado.portada,
        banner: estado.banner || null,
        referencias: JSON.stringify(estado.referencias),
        videos: JSON.stringify(recolectarVideos()),
        youtube_id: ''
    };

    if (t === 'servidor') {
        const p = estado.plataformaServidor;
        const multi = estado.multiplataforma && p !== 'realms';
        reg.plataforma = p;
        reg.multiplataforma = multi;
        reg.version = inputVersionServidor.value.trim();
        reg.botones_descarga = '[]';
        reg.precio_activo = false;
        reg.precio_monto = 0;
        reg.precio_moneda = null;
        reg.contacto_whatsapp = '';
        reg.contacto_discord = '';
        if (p === 'realms') {
            reg.realm_enlace = inputRealm.value.trim();
            reg.ip = ''; reg.puerto = ''; reg.puerto_java = ''; reg.puerto_bedrock = '';
        } else {
            const principal = inputPuerto.value.trim() || puertoDefecto(p);
            const extra = multi ? (inputPuertoExtra.value.trim() || puertoDefecto(p === 'java' ? 'bedrock' : 'java')) : '';
            reg.realm_enlace = '';
            reg.ip = normalizarIp(inputIp.value);
            reg.puerto = principal;
            reg.puerto_java = p === 'java' ? principal : extra;
            reg.puerto_bedrock = p === 'bedrock' ? principal : extra;
        }
        const redes = {};
        document.querySelectorAll('.campo-red-input').forEach(inp => {
            const v = inp.value.trim();
            if (v) redes[inp.dataset.red] = v;
        });
        reg.web_url = redes.web_url || '';
        reg.discord_url = redes.discord_url || '';
        delete redes.web_url;
        delete redes.discord_url;
        reg.redes = JSON.stringify(redes);
    } else {
        reg.version = inputVersionMc.value.trim();
        reg.plataforma = estado.plataformaAddon || '';
        reg.botones_descarga = JSON.stringify(recolectarBotonesDescarga());
        reg.precio_activo = estado.precioActivo;
        reg.precio_monto = estado.precioActivo ? leerPrecio() : 0;
        reg.precio_moneda = estado.precioActivo ? selectMoneda.value : null;
        reg.contacto_whatsapp = estado.precioActivo && whatsappValido() ? whatsappDigitos() : '';
        reg.contacto_discord = estado.precioActivo ? inputContactoDiscord.value.trim() : '';
    }
    return reg;
}

function urlsImagenesDe(addon) {
    if (!addon) return [];
    return [addon.portada, addon.banner].concat(T.listaJson(addon.referencias)).filter(Boolean);
}

btnPublicar.addEventListener('click', async () => {
    if (!currentUser) {
        window.location.href = rutasNavegacionAndEnlacesMcpixel.login;
        return;
    }
    validar();
    if (faltantes.length > 0) {
        mostrarMensaje('Te falta: ' + faltantes.join(', ') + '.');
        return;
    }
    const textoOriginal = btnPublicar.textContent;
    btnPublicar.textContent = idEdicion ? 'Guardando...' : 'Publicando...';
    btnPublicar.classList.remove('habilitado');

    // Agrupa las subidas de este guardado: si algo falla se borran las recién subidas
    const imagenes = mcDB.imagenes.sesion(currentUser.id);

    try {
        const registro = construirRegistro();

        // 1) Imágenes nuevas -> Storage. Las que ya estaban subidas se dejan tal cual.
        registro.portada = await imagenes.subir('portadas', estado.portada);
        registro.banner = await imagenes.subir('banners', estado.banner);
        const referencias = await imagenes.subirVarias('galeria', estado.referencias);
        registro.referencias = JSON.stringify(referencias);

        // 2) Guardar la publicación
        let idDestino = idEdicion;
        if (idEdicion) {
            const { data, error } = await mcDB.from('addons').update(registro).eq('id', idEdicion).select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('No tienes permiso para editar esta publicación.');
        } else {
            registro.user_id = currentUser.id;
            const { data, error } = await mcDB.from('addons').insert(registro).select('id').single();
            if (error) throw error;
            idDestino = data.id;
        }

        // 3) Todo salió bien: se borran de Storage las imágenes anteriores que ya no se usan
        //    (las que se reemplazaron o se quitaron en esta edición)
        if (idEdicion && addonEdicion) {
            await imagenes.limpiar(
                urlsImagenesDe(addonEdicion),
                [registro.portada, registro.banner].concat(referencias)
            );
        }
        mcDB.invalidarContenido();

        window.location.href = rutasNavegacionAndEnlacesMcpixel.view + '?id=' + idDestino;
    } catch (error) {
        console.error('Error al guardar la publicación:', error);
        await imagenes.revertir();
        btnPublicar.textContent = textoOriginal;
        validar();
        mostrarMensaje((error && error.message) || 'No se pudo guardar la publicación.');
    }
});

function mostrarUsoAlmacenamiento() {
    el('usoAlmacenamiento').textContent = 'Las imágenes se optimizan y se guardan en la nube. Si reemplazas o quitas una, la anterior se elimina automáticamente.';
}

/* ---------- Modo edición ---------- */
async function cargarEdicion() {
    let data = null;
    try { data = await mcDB.obtenerAddon(idEdicion, true); } catch (e) { data = null; }
    if (!data || data.user_id !== currentUser.id) {
        window.location.href = rutasNavegacionAndEnlacesMcpixel.profile;
        return;
    }
    addonEdicion = data;
    estado.tipo = T.tipoDe(data);
    estado.portada = data.portada || null;
    estado.banner = data.banner || null;
    estado.referencias = T.listaJson(data.referencias).slice(0, MAX_REFERENCIAS);
    renderizarSelectorTipo();
    aplicarTipo();

    pintarZona(zonaPortada, previewPortada, estado.portada);
    pintarZona(zonaBanner, previewBanner, estado.banner);
    renderizarReferencias();
    T.videosDe(data).forEach(v => crearFilaVideo(v.url));

    inputNombre.value = data.nombre || '';
    inputDescripcion.value = data.descripcion || '';
    inputEtiquetas.value = data.etiquetas || '';

    if (estado.tipo === 'servidor') {
        estado.plataformaServidor = data.plataforma || 'java';
        estado.multiplataforma = !!data.multiplataforma;
        inputVersionServidor.value = data.version || '';
        inputIp.value = data.ip || '';
        inputPuerto.value = data.puerto || '';
        const extra = estado.plataformaServidor === 'java' ? data.puerto_bedrock : data.puerto_java;
        inputPuertoExtra.value = estado.multiplataforma ? (extra || '') : '';
        inputRealm.value = data.realm_enlace || '';
        const redes = (() => { try { return JSON.parse(data.redes || '{}'); } catch (e) { return {}; } })();
        redes.web_url = data.web_url || '';
        redes.discord_url = data.discord_url || '';
        document.querySelectorAll('.campo-red-input').forEach(inp => { inp.value = redes[inp.dataset.red] || ''; });
        aplicarPlataformaServidor();
    } else {
        inputVersionMc.value = data.version || '';
        if (data.plataforma === 'bedrock') btnBedrock.click();
        if (data.plataforma === 'java') btnJava.click();
        T.listaJson(data.botones_descarga).forEach(b => crearFilaBotonDescarga(b.url, b.nombre));
        estado.precioActivo = T.precioActivo(data);
        if (estado.precioActivo) {
            inputPrecio.value = String(data.precio_monto);
            selectMoneda.value = data.precio_moneda || selectMoneda.value;
            inputContactoWhatsapp.value = data.contacto_whatsapp ? '+' + data.contacto_whatsapp : '';
            inputContactoDiscord.value = data.contacto_discord || '';
        }
        aplicarPrecio();
    }
    validar();
}

function escaparInfo(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function itemsInfoPost() {
    const nombreTipo = McShared.TIPO_POR_ID[estado.tipo].nombre;
    const esServidor = estado.tipo === 'servidor';
    const items = [
        ['banner', 'Imagen de Banner', 'Es la imagen ancha (3:1) que se muestra arriba de la página de tu ' + nombreTipo + ' y sirve como portada de su tarjeta en el inicio, en Explorar y en los perfiles. Es opcional: si no subes una, se usa la portada.'],
        ['portada', 'Imagen de Portada', 'Es la imagen cuadrada (1:1) que aparece junto al título y al compartir tu ' + nombreTipo + '. Es obligatoria y también se usa en las tarjetas cuando no hay banner.'],
        ['galeria', 'Imágenes adicionales', 'Galería de hasta 6 capturas (1200x675) para mostrar cómo se ve o cómo funciona.'],
        ['videos', 'Videos', 'Enlaces de YouTube, Vimeo o un video directo (.mp4, .webm) que se verán en la galería.'],
        ['nombre', 'Nombre', 'El título con el que la gente encontrará y reconocerá tu ' + nombreTipo + '.'],
        ['descripcion', 'Descripción', 'Cuenta de qué trata, sus características y cómo funciona. Admite formato: # títulos, **negrita**, *cursiva*, listas, enlaces y -# para texto pequeño.'],
        ['etiquetas', 'Etiquetas', 'Palabras clave separadas por comas que ayudan a encontrar tu publicación al buscar.']
    ];
    if (esServidor) {
        items.push(
            ['plataforma-servidor', 'Plataforma del Servidor', 'Indica si es Java, Bedrock o Realms. Con Multiplataforma los jugadores de Java y Bedrock pueden entrar al mismo servidor.'],
            ['direccion', 'IP o dirección y Puerto', 'Es lo que se muestra para entrar al servidor, con botones para copiarlos. Escríbela sin http:// ni espacios.'],
            ['version-servidor', 'Versión del Servidor', 'La versión de Minecraft en la que funciona tu servidor.'],
            ['redes', 'Web y redes del servidor', 'Enlaces a tu web, Discord u otras redes para que la comunidad te encuentre.']
        );
    } else {
        items.push(
            ['version', 'Versión de Minecraft', 'La versión del juego con la que funciona tu ' + nombreTipo + '. Se ve en un chip de la tarjeta.'],
            ['plataforma', 'Plataforma', 'Indica si es para Java o Bedrock.'],
            ['descarga', 'Botones de Descarga', 'Los enlaces para obtener el archivo. El primero es el botón verde de descargar y los demás se muestran como descargas alternativas (botón amarillo).'],
            ['precio', 'Precio', 'Si es gratis o de pago. En el pago, la gente te contactará por WhatsApp o Discord para comprarlo.']
        );
    }
    return items;
}

function cerrarModalInfoPost() {
    const modal = el('modalInfoPost');
    modal.classList.remove('abierto');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function abrirModalInfoPost(clave) {
    const modal = el('modalInfoPost');
    const lista = el('infoPostLista');
    lista.innerHTML = itemsInfoPost().map(it =>
        '<div class="info-post-item' + (it[0] === clave ? ' resaltado' : '') + '" data-clave="' + it[0] + '">' +
        '<div class="info-post-item-titulo">' + escaparInfo(it[1]) + '</div>' +
        '<div class="info-post-item-texto">' + escaparInfo(it[2]) + '</div></div>'
    ).join('');
    modal.classList.add('abierto');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const destacado = lista.querySelector('.resaltado');
    lista.scrollTop = destacado ? Math.max(0, destacado.offsetTop - lista.offsetTop - 8) : 0;
}

document.querySelectorAll('.btn-info-post').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        abrirModalInfoPost(btn.dataset.info || '');
    });
});
el('btnCerrarInfoPost').addEventListener('click', cerrarModalInfoPost);
el('modalInfoPost').addEventListener('click', (e) => { if (e.target === el('modalInfoPost')) cerrarModalInfoPost(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModalInfoPost(); });

(async function iniciarFormulario() {
    inicializarPantalla();
    await verificarSesion();
    renderizarSelectorTipo();
    aplicarTipo();
    aplicarPrecio();
    mostrarUsoAlmacenamiento();
    if (idEdicion && currentUser) await cargarEdicion();
    else if (!idEdicion) crearFilaBotonDescarga();
})();
