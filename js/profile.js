const rutasNavegacionAndEnlacesMcpixel = {
    login: "../login/",
    register: "../register/",
    inicio: "../",
    explorar: "../explore/",
    profile: "../profile/",
    view: "../view/",
    post: "../post/",
    favorites: "../favorites/",
    postEdit: "../post/"
};

let usuarioActualDocumento = null;
let archivoAvatarSeleccionado = null;
let archivoBannerSeleccionado = null;

const perfilBtn = document.getElementById('perfilBtn');
const sidebarMenu = document.getElementById('sidebarMenu');
const toggleCollapseBtn = document.getElementById('toggleCollapseBtn');
const cuerpo = document.body;

const panelEditor = document.getElementById('panelEditor');
const btnAbrirEditor = document.getElementById('btnAbrirEditor');
const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');

const bloqueCambiarFoto = document.getElementById('bloqueCambiarFoto');
const bloqueCambiarBanner = document.getElementById('bloqueCambiarBanner');
const inputArchivoAvatar = document.getElementById('inputArchivoAvatar');
const inputArchivoBanner = document.getElementById('inputArchivoBanner');

const lblNombreVisible = document.getElementById('lblNombreVisible');
const lblNombreUsuario = document.getElementById('lblNombreUsuario');
const lblBiografia = document.getElementById('lblBiografia');
const vistaBannerRaiz = document.getElementById('vistaBannerRaiz');
const badgeVerificado = document.getElementById('badgeVerificado');

const txtEditNombreVisible = document.getElementById('txtEditNombreVisible');
const txtEditNombreUsuario = document.getElementById('txtEditNombreUsuario');
const txtEditBiografia = document.getElementById('txtEditBiografia');

const txtDiscord = document.getElementById('txtDiscord');
const txtWhatsapp = document.getElementById('txtWhatsapp');
const txtTiktok = document.getElementById('txtTiktok');
const txtYoutube = document.getElementById('txtYoutube');
const txtWeb = document.getElementById('txtWeb');

const lnkPerfilRedDiscord = document.getElementById('lnkPerfilRedDiscord');
const lnkPerfilRedWhatsapp = document.getElementById('lnkPerfilRedWhatsapp');
const lnkPerfilRedTiktok = document.getElementById('lnkPerfilRedTiktok');
const lnkPerfilRedYoutube = document.getElementById('lnkPerfilRedYoutube');
const lnkPerfilRedWeb = document.getElementById('lnkPerfilRedWeb');

document.getElementById('logoInicio').addEventListener('click', () => {
    window.location.href = rutasNavegacionAndEnlacesMcpixel.inicio;
});

document.getElementById('menuLinkInicio').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.inicio);
document.getElementById('menuLinkExplorar').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.explorar);
document.getElementById('menuLinkPerfil').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.profile);
document.getElementById('menuLinkFavoritos').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.favorites);

function inicializarPantalla() {
    if (window.innerWidth >= 768) {
        const estadoGuardado = localStorage.getItem('mcpixel_sidebar_pc');
        if (estadoGuardado === 'minimizado') {
            cuerpo.classList.add('sidebar-minimizado-pc');
            cuerpo.classList.remove('sidebar-abierto-pc');
        } else {
            cuerpo.classList.add('sidebar-abierto-pc');
            cuerpo.classList.remove('sidebar-minimizado-pc');
        }
    }
}

perfilBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.innerWidth >= 768) {
        if (cuerpo.classList.contains('sidebar-minimizado-pc')) {
            cuerpo.classList.remove('sidebar-minimizado-pc');
            cuerpo.classList.add('sidebar-abierto-pc');
            localStorage.setItem('mcpixel_sidebar_pc', 'abierto');
        }
    } else {
        sidebarMenu.classList.toggle('activo');
    }
});

toggleCollapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (cuerpo.classList.contains('sidebar-abierto-pc')) {
        cuerpo.classList.remove('sidebar-abierto-pc');
        cuerpo.classList.add('sidebar-minimizado-pc');
        localStorage.setItem('mcpixel_sidebar_pc', 'minimizado');
    } else {
        cuerpo.classList.remove('sidebar-minimizado-pc');
        cuerpo.classList.add('sidebar-abierto-pc');
        localStorage.setItem('mcpixel_sidebar_pc', 'abierto');
    }
});

document.addEventListener('click', () => {
    if (window.innerWidth < 768) sidebarMenu.classList.remove('activo');
});
sidebarMenu.addEventListener('click', (e) => e.stopPropagation());

window.addEventListener('resize', () => {
    cuerpo.classList.remove('sidebar-abierto-pc', 'sidebar-minimizado-pc');
    inicializarPantalla();
});

async function verificarSesion() {
    try {
        const { data: { session } } = await mcDB.auth.getSession();

        if (!session) {
            window.location.href = rutasNavegacionAndEnlacesMcpixel.login;
            return;
        }

        const authUser = session.user;

        let docUsuario = null;
        try { docUsuario = await mcDB.obtenerPerfil(authUser.id); } catch (e) { docUsuario = null; }

        if (!docUsuario) {
            window.location.href = rutasNavegacionAndEnlacesMcpixel.login;
            return;
        }

        usuarioActualDocumento = docUsuario;

        lblNombreVisible.textContent = docUsuario.nombre_visible || docUsuario.username || "Usuario";
        lblNombreUsuario.textContent = `@${docUsuario.username}`;
        lblBiografia.textContent = docUsuario.bio || "Sin biografía disponible.";

        if (docUsuario.verificado === true) {
            badgeVerificado.style.display = 'inline-flex';
        } else {
            badgeVerificado.style.display = 'none';
        }

        if (docUsuario.avatar) {
            document.getElementById('perfilBtn').innerHTML = `<img src="${McShared.esc(docUsuario.avatar)}" alt="Avatar" class="perfil-img-activa">`;
            document.getElementById('perfilAvatarRaiz').innerHTML = `<img src="${McShared.esc(docUsuario.avatar)}" alt="Avatar">`;
            document.getElementById('panelEditorAvatarVista').innerHTML = `<img src="${McShared.esc(docUsuario.avatar)}" alt="Avatar">`;
        }

        if (docUsuario.banner) {
            vistaBannerRaiz.innerHTML = `<img src="${McShared.esc(docUsuario.banner)}" alt="Banner">`;
            const bannerExistente = bloqueCambiarBanner.querySelector('img');
            if (!bannerExistente) {
                const nuevaImg = document.createElement('img');
                nuevaImg.src = docUsuario.banner;
                bloqueCambiarBanner.appendChild(nuevaImg);
            }
        }

        const elementosBloqueados = ['menuLinkFavoritos', 'menuLinkServidores'];
        elementosBloqueados.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('deshabilitado');
            }
        });

        actualizarRedesSocialesPerfil(docUsuario);
        await cargarAddonsDelUsuario(docUsuario.id);

    } catch (error) {
        console.error("No hay sesión activa:", error);
        window.location.href = rutasNavegacionAndEnlacesMcpixel.login;
    }
}

function actualizarRedesSocialesPerfil(doc) {
    const redes = [
        { el: lnkPerfilRedDiscord, url: doc.discord },
        { el: lnkPerfilRedWhatsapp, url: doc.whatsapp },
        { el: lnkPerfilRedTiktok, url: doc.tiktok },
        { el: lnkPerfilRedYoutube, url: doc.youtube },
        { el: lnkPerfilRedWeb, url: doc.web }
    ];

    redes.forEach(red => {
        const urlSegura = McShared.urlSegura(red.url);
        if (urlSegura) {
            red.el.setAttribute('href', urlSegura);
            red.el.style.display = 'flex';
        } else {
            red.el.style.display = 'none';
        }
    });
}

function confirmarEliminacion(nombreTipo, nombre) {
    return new Promise((resolve) => {
        const SEGUNDOS = 5;
        const fondo = document.createElement('div');
        fondo.className = 'modal-eliminar';
        fondo.setAttribute('aria-hidden', 'false');
        fondo.innerHTML = `
            <div class="modal-eliminar-caja" role="alertdialog" aria-modal="true" aria-labelledby="tituloEliminar">
                <div class="modal-eliminar-interno">
                    <div class="modal-eliminar-icono">
                        <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <h3 class="modal-eliminar-titulo" id="tituloEliminar"></h3>
                    <div class="modal-eliminar-nombre"></div>
                    <p class="modal-eliminar-aviso">Esta acción es irreversible. Se borrará para siempre y no se podrá recuperar.</p>
                    <div class="modal-eliminar-botones">
                        <button type="button" class="btn-pixel neutro btn-eliminar-cancelar">Cancelar</button>
                        <button type="button" class="btn-pixel peligro btn-eliminar-confirmar" disabled></button>
                    </div>
                </div>
            </div>
        `;
        fondo.querySelector('.modal-eliminar-titulo').textContent = '¿Quieres Eliminar este ' + nombreTipo + '?';
        const nombreEl = fondo.querySelector('.modal-eliminar-nombre');
        if (nombre) nombreEl.textContent = nombre; else nombreEl.style.display = 'none';

        const btnCancelar = fondo.querySelector('.btn-eliminar-cancelar');
        const btnConfirmar = fondo.querySelector('.btn-eliminar-confirmar');
        let restante = SEGUNDOS;
        const pintar = () => {
            btnConfirmar.textContent = restante > 0 ? 'Eliminar (' + restante + ')' : 'Eliminar';
            btnConfirmar.disabled = restante > 0;
        };
        pintar();
        const intervalo = setInterval(() => {
            restante--;
            pintar();
            if (restante <= 0) clearInterval(intervalo);
        }, 1000);

        const cerrar = (resultado) => {
            clearInterval(intervalo);
            document.removeEventListener('keydown', alTeclear);
            fondo.remove();
            document.body.style.overflow = '';
            resolve(resultado);
        };
        const alTeclear = (e) => { if (e.key === 'Escape') cerrar(false); };
        document.addEventListener('keydown', alTeclear);

        btnCancelar.addEventListener('click', () => cerrar(false));
        btnConfirmar.addEventListener('click', () => { if (restante <= 0) cerrar(true); });
        fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrar(false); });

        document.body.style.overflow = 'hidden';
        document.body.appendChild(fondo);
        btnCancelar.focus();
    });
}

function urlsImagenesDe(addon) {
    return [addon.portada, addon.banner].concat(McShared.listaJson(addon.referencias)).filter(Boolean);
}

const T = McShared;
const estadoPublicaciones = { todas: [], tab: 'todo', orden: 'recientes', userId: null };

function contarPorTipo(lista) {
    const cuentas = {};
    lista.forEach(p => {
        const t = T.tipoDe(p);
        cuentas[t] = (cuentas[t] || 0) + 1;
    });
    return cuentas;
}

function pintarEstadisticas() {
    const lista = estadoPublicaciones.todas;
    const cuentas = contarPorTipo(lista);
    let descargas = 0;
    let likes = 0;
    lista.forEach(p => {
        likes += parseInt(p.likes) || 0;
        if (T.tipoDe(p) !== 'servidor') descargas += parseInt(p.descargas) || 0;
    });

    const tarjetas = [];
    tarjetas.push(
        '<div class="tarjeta-estadistica">' +
            '<span class="estadistica-label">Publicaciones</span>' +
            '<span class="estadistica-valor">' + lista.length + '</span>' +
        '</div>'
    );
    T.TIPOS.forEach(t => {
        if (!cuentas[t.id]) return;
        tarjetas.push(
            '<div class="tarjeta-estadistica estadistica-tipo" style="--c-tipo:' + t.c + '">' +
                '<span class="estadistica-label">' + T.svgTipo(t) + T.esc(t.plural) + '</span>' +
                '<span class="estadistica-valor">' + cuentas[t.id] + '</span>' +
            '</div>'
        );
    });
    if (lista.some(p => T.tipoDe(p) !== 'servidor')) {
        tarjetas.push(
            '<div class="tarjeta-estadistica">' +
                '<span class="estadistica-label">Descargas</span>' +
                '<span class="estadistica-valor">' + T.formatearNumero(descargas) + '</span>' +
            '</div>'
        );
    }
    tarjetas.push(
        '<div class="tarjeta-estadistica">' +
            '<span class="estadistica-label">Me Gustas</span>' +
            '<span class="estadistica-valor">' + T.formatearNumero(likes) + '</span>' +
        '</div>'
    );
    document.getElementById('gridEstadisticas').innerHTML = tarjetas.join('');
}

function pintarTabs() {
    const cont = document.getElementById('tabsPublicaciones');
    const lista = estadoPublicaciones.todas;
    if (lista.length === 0) {
        cont.style.display = 'none';
        document.getElementById('bloqueOrden').style.display = 'none';
        return;
    }
    cont.style.display = 'flex';
    document.getElementById('bloqueOrden').style.display = 'flex';

    const cuentas = contarPorTipo(lista);
    if (estadoPublicaciones.tab !== 'todo' && !cuentas[estadoPublicaciones.tab]) estadoPublicaciones.tab = 'todo';
    const tabs = [{ id: 'todo', nombre: 'Todo', cantidad: lista.length, tipo: null }];
    T.TIPOS.forEach(t => {
        if (cuentas[t.id]) tabs.push({ id: t.id, nombre: t.plural, cantidad: cuentas[t.id], tipo: t });
    });

    cont.innerHTML = tabs.map(tab => {
        const activo = tab.id === estadoPublicaciones.tab ? ' activo' : '';
        const estilo = tab.tipo ? ' style="--ac:' + tab.tipo.c + ';--ac-osc:' + tab.tipo.osc + ';--ac-t:' + tab.tipo.t + '"' : '';
        const icono = tab.tipo ? T.svgTipo(tab.tipo) : '';
        return '<button type="button" class="perfil-tab' + activo + '" role="tab" data-tab="' + tab.id + '"' +
            ' aria-selected="' + (activo ? 'true' : 'false') + '"' + estilo + '>' +
            icono + '<span>' + T.esc(tab.nombre) + '</span><span class="tab-cantidad">' + tab.cantidad + '</span></button>';
    }).join('');

    cont.querySelectorAll('.perfil-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            estadoPublicaciones.tab = btn.dataset.tab;
            const url = new URL(window.location.href);
            if (btn.dataset.tab === 'todo') url.searchParams.delete('tab');
            else url.searchParams.set('tab', btn.dataset.tab);
            window.history.replaceState({}, '', url.toString());
            pintarTabs();
            pintarPublicaciones();
        });
    });
}

function ordenarPublicaciones(lista) {
    const orden = estadoPublicaciones.orden;
    const copia = lista.slice();
    if (orden === 'likes') {
        copia.sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
    } else if (orden === 'descargas') {
        copia.sort((a, b) => (parseInt(b.descargas) || 0) - (parseInt(a.descargas) || 0));
    }
    return copia;
}

function listaEtiquetas(pub) {
    return String(pub.etiquetas || '').split(',').map(e => e.trim()).filter(Boolean);
}

function botonesPropietario(pub) {
    const caja = document.createElement('div');
    caja.className = 'addon-acciones-botones';
    caja.innerHTML =
        '<a href="' + rutasNavegacionAndEnlacesMcpixel.view + '?id=' + T.esc(pub.id) + '" class="btn-addon-accion ver" title="Ver">' +
            '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
        '</a>' +
        '<a href="' + rutasNavegacionAndEnlacesMcpixel.postEdit + '?id=' + T.esc(pub.id) + '" class="btn-addon-accion editar" title="Editar">' +
            '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
        '</a>' +
        '<button type="button" class="btn-addon-accion eliminar" title="Eliminar">' +
            '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        '</button>';
    caja.addEventListener('click', e => e.stopPropagation());
    caja.querySelector('.eliminar').addEventListener('click', async () => {
        const nombreTipo = T.TIPO_POR_ID[T.tipoDe(pub)].nombre;
        if (!(await confirmarEliminacion(nombreTipo, pub.nombre))) return;
        try {
            const { data: borrados, error: errorBorrar } = await mcDB
                .from('addons')
                .delete()
                .eq('id', pub.id)
                .select('id');
            if (errorBorrar) throw errorBorrar;
            if (!borrados || borrados.length === 0) throw new Error('No se pudo eliminar la publicación.');

            await mcDB.imagenes.borrar(urlsImagenesDe(pub));
            mcDB.invalidarContenido();

            await cargarAddonsDelUsuario(estadoPublicaciones.userId, true);
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        }
    });
    return caja;
}

function tarjetaNormal(pub) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-premium-addon';

    const extras = [];
    const plat = T.tipoDe(pub) !== 'servidor' && pub.plataforma && T.PLATAFORMAS_SERVIDOR[pub.plataforma];
    if (plat) extras.push('<span class="etiqueta-mini plataforma">' + T.esc(plat) + '</span>');
    listaEtiquetas(pub).slice(0, 3).forEach(et => extras.push('<span class="etiqueta-mini">#' + T.esc(et) + '</span>'));

    tarjeta.innerHTML = T.cardInterior(pub, { usarBanner: true, imgError: '../img/icons/ic5.png' }) +
        (extras.length ? '<div class="perfil-tarjeta-extra">' + extras.join('') + '</div>' : '');
    tarjeta.appendChild(botonesPropietario(pub));
    return tarjeta;
}

function tarjetaServidor(srv) {
    const esRealm = srv.plataforma === 'realms';
    const multi = !!srv.multiplataforma && !esRealm;
    const imagen = T.urlSegura(srv.banner) || srv.banner || srv.portada || '';

    const chips = [];
    if (esRealm) chips.push('Realms');
    else if (multi) chips.push('Java', 'Bedrock');
    else chips.push(T.PLATAFORMAS_SERVIDOR[srv.plataforma] || 'Java');

    const puertoJava = srv.puerto_java || (srv.plataforma === 'java' ? srv.puerto : '') || T.PUERTO_POR_DEFECTO.java;
    const puertoBedrock = srv.puerto_bedrock || (srv.plataforma === 'bedrock' ? srv.puerto : '') || T.PUERTO_POR_DEFECTO.bedrock;

    const datos = [];
    datos.push(['Plataforma', T.etiquetaPlataformaServidor(srv)]);
    datos.push(['Versión', srv.version || 'Cualquiera']);
    if (!esRealm) {
        if (srv.plataforma === 'java' || multi) datos.push(['Puerto Java', puertoJava]);
        if (srv.plataforma === 'bedrock' || multi) datos.push(['Puerto Bedrock', puertoBedrock]);
    }
    datos.push(['Publicado', T.fechaCorta(srv)]);

    const tags = listaEtiquetas(srv).slice(0, 5).map(et => '<span class="etiqueta-mini">#' + T.esc(et) + '</span>').join('');
    const textoIp = esRealm ? 'Realm de Minecraft' : (T.textoIp(srv) || 'Sin IP');

    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta-servidor';
    tarjeta.innerHTML =
        '<div class="srv-banner">' +
            (imagen ? '<img src="' + T.esc(imagen) + '" alt="' + T.esc(srv.nombre || 'Servidor') + '" onerror="this.style.display=\'none\'">' : '') +
            '<div class="srv-plataformas">' + chips.map(c => '<span class="srv-chip">' + T.esc(c) + '</span>').join('') + '</div>' +
            '<div class="srv-likes">' + T.iconos.like + '<span>' + T.formatearNumero(srv.likes) + '</span></div>' +
        '</div>' +
        '<div class="srv-cuerpo">' +
            '<h4 class="srv-nombre">' + T.esc(srv.nombre || 'Sin nombre') + '</h4>' +
            '<div class="srv-ip"><code title="Dirección del servidor">' + T.esc(textoIp) + '</code></div>' +
            '<p class="srv-desc">' + T.esc(srv.descripcion || 'Sin descripción disponible.') + '</p>' +
            '<div class="srv-datos">' + datos.map(d => '<div class="srv-dato"><small>' + T.esc(d[0]) + '</small><span>' + T.esc(d[1]) + '</span></div>').join('') + '</div>' +
            (tags ? '<div class="srv-tags">' + tags + '</div>' : '') +
        '</div>';
    tarjeta.appendChild(botonesPropietario(srv));
    return tarjeta;
}

function pintarPublicaciones() {
    const grid = document.getElementById('gridAddonsUsuario');
    const vacio = document.getElementById('estadoVacioAddons');
    const titulo = document.getElementById('tituloPublicaciones');
    const tab = estadoPublicaciones.tab;
    const enTab = tab === 'todo' ? estadoPublicaciones.todas : estadoPublicaciones.todas.filter(p => T.tipoDe(p) === tab);

    titulo.textContent = tab === 'todo' ? 'Mis publicaciones' : 'Mis ' + T.TIPO_POR_ID[tab].plural.toLowerCase();

    const optDescargas = document.querySelector('#selOrden option[value="descargas"]');
    if (optDescargas) optDescargas.hidden = tab === 'servidor';
    if (tab === 'servidor' && estadoPublicaciones.orden === 'descargas') {
        estadoPublicaciones.orden = 'recientes';
        document.getElementById('selOrden').value = 'recientes';
    }

    if (enTab.length === 0) {
        vacio.style.display = 'flex';
        document.getElementById('textoEstadoVacio').textContent = 'No tienes publicaciones actualmente.';
        grid.style.display = 'none';
        return;
    }

    vacio.style.display = 'none';
    grid.style.display = 'grid';
    grid.classList.toggle('grid-servidores', tab === 'servidor');
    grid.innerHTML = '';
    ordenarPublicaciones(enTab).forEach(pub => {
        grid.appendChild(T.tipoDe(pub) === 'servidor' && tab === 'servidor' ? tarjetaServidor(pub) : tarjetaNormal(pub));
    });
}

document.getElementById('selOrden').addEventListener('change', (e) => {
    estadoPublicaciones.orden = e.target.value;
    pintarPublicaciones();
});

async function cargarAddonsDelUsuario(userId, forzar) {
    try {
        const publicaciones = await mcDB.addonsDeUsuario(userId, forzar);
        estadoPublicaciones.userId = userId;
        estadoPublicaciones.todas = publicaciones;

        if (!estadoPublicaciones.inicializado) {
            estadoPublicaciones.inicializado = true;
            const tabPedida = new URLSearchParams(window.location.search).get('tab');
            if (tabPedida && T.TIPO_POR_ID[tabPedida] && publicaciones.some(p => T.tipoDe(p) === tabPedida)) {
                estadoPublicaciones.tab = tabPedida;
            }
        }

        pintarEstadisticas();
        pintarTabs();
        pintarPublicaciones();
    } catch (error) {
        console.error("Error cargando publicaciones:", error);
        const vacio = document.getElementById('estadoVacioAddons');
        vacio.style.display = 'flex';
        document.getElementById('textoEstadoVacio').textContent = 'Error al cargar las publicaciones.';
        document.getElementById('gridAddonsUsuario').style.display = 'none';
    }
}

function normalizarEnlace(valor, nombre) {
    let v = String(valor || '').trim();
    if (!v) return '';
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    if (!/^https?:\/\/[^\s"'<>]+$/i.test(v) || v.length > 300) {
        throw new Error('El enlace de ' + nombre + ' no es válido.');
    }
    return v;
}

btnGuardarEdicion.addEventListener('click', async () => {
    if (!usuarioActualDocumento) return;

    btnGuardarEdicion.disabled = true;
    btnGuardarEdicion.textContent = "Guardando...";

    const imagenes = mcDB.imagenes.sesion(usuarioActualDocumento.id);

    try {
        const enlaces = {
            discord: normalizarEnlace(txtDiscord.value, 'Discord'),
            whatsapp: normalizarEnlace(/^\+?[\d\s()-]{8,20}$/.test(txtWhatsapp.value.trim()) ? 'https://wa.me/' + txtWhatsapp.value.replace(/\D/g, '') : txtWhatsapp.value, 'WhatsApp'),
            tiktok: normalizarEnlace(txtTiktok.value, 'TikTok'),
            youtube: normalizarEnlace(txtYoutube.value, 'YouTube'),
            web: normalizarEnlace(txtWeb.value, 'tu sitio web')
        };

        const avatarAnterior = usuarioActualDocumento.avatar || '';
        const bannerAnterior = usuarioActualDocumento.banner || '';
        let urlAvatarFinal = avatarAnterior;
        let urlBannerFinal = bannerAnterior;

        if (archivoAvatarSeleccionado) {
            urlAvatarFinal = await imagenes.subir('avatars', archivoAvatarSeleccionado);
        }
        if (archivoBannerSeleccionado) {
            urlBannerFinal = await imagenes.subir('perfil-banners', archivoBannerSeleccionado);
        }

        const { data, error } = await mcDB
            .from('users')
            .update({
                nombre_visible: txtEditNombreVisible.value.trim(),
                bio: txtEditBiografia.value.trim(),
                avatar: urlAvatarFinal,
                banner: urlBannerFinal,
                discord: enlaces.discord,
                whatsapp: enlaces.whatsapp,
                tiktok: enlaces.tiktok,
                youtube: enlaces.youtube,
                web: enlaces.web
            })
            .eq('id', usuarioActualDocumento.id)
            .select('id');

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('No se pudo guardar el perfil.');

        await imagenes.limpiar([avatarAnterior, bannerAnterior], [urlAvatarFinal, urlBannerFinal]);
        mcDB.invalidarPerfil(usuarioActualDocumento.id);

        panelEditor.classList.remove('activo');
        archivoAvatarSeleccionado = null;
        archivoBannerSeleccionado = null;

        await verificarSesion();

    } catch (error) {
        await imagenes.revertir();
        alert("Error al actualizar perfil: " + error.message);
    } finally {
        btnGuardarEdicion.disabled = false;
        btnGuardarEdicion.textContent = "Guardar";
    }
});

btnAbrirEditor.addEventListener('click', () => {
    if (!usuarioActualDocumento) return;

    txtEditNombreVisible.value = usuarioActualDocumento.nombre_visible || "";
    txtEditNombreUsuario.value = `@${usuarioActualDocumento.username}`;
    txtEditBiografia.value = usuarioActualDocumento.bio || "";

    txtDiscord.value = usuarioActualDocumento.discord || "";
    txtWhatsapp.value = usuarioActualDocumento.whatsapp || "";
    txtTiktok.value = usuarioActualDocumento.tiktok || "";
    txtYoutube.value = usuarioActualDocumento.youtube || "";
    txtWeb.value = usuarioActualDocumento.web || "";

    panelEditor.classList.add('activo');
});

btnCancelarEdicion.addEventListener('click', () => {
    panelEditor.classList.remove('activo');
    archivoAvatarSeleccionado = null;
    archivoBannerSeleccionado = null;
    verificarSesion();
});

bloqueCambiarFoto.addEventListener('click', (e) => {
    e.stopPropagation();
    inputArchivoAvatar.click();
});

bloqueCambiarBanner.addEventListener('click', () => {
    inputArchivoBanner.click();
});

inputArchivoAvatar.addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
        archivoAvatarSeleccionado = archivo;
        const lector = new FileReader();
        lector.onload = function(evt) {
            const avatarVista = document.getElementById('panelEditorAvatarVista');
            avatarVista.innerHTML = `<img src="${evt.target.result}" alt="Avatar">`;
        };
        lector.readAsDataURL(archivo);
    }
});

inputArchivoBanner.addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
        archivoBannerSeleccionado = archivo;
        const lector = new FileReader();
        lector.onload = function(evt) {
            const imgExistente = bloqueCambiarBanner.querySelector('img');
            if (imgExistente) {
                imgExistente.src = evt.target.result;
            } else {
                const nuevaImg = document.createElement('img');
                nuevaImg.src = evt.target.result;
                bloqueCambiarBanner.insertBefore(nuevaImg, bloqueCambiarBanner.firstChild);
            }
        };
        lector.readAsDataURL(archivo);
    }
});

function formatearNumero(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

(async function iniciarApp() {
    inicializarPantalla();
    await verificarSesion();
})();
