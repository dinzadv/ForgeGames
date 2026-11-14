const rutasNavegacionAndEnlacesMcpixel = {
    login: "../login/",
    register: "../register/",
    inicio: "../",
    explorar: "../explore/",
    profile: "../profile/",
    view: "../view/",
    post: "../post/",
    favorites: "#",
    profileView: "../user/"
};

document.getElementById('logoInicio').addEventListener('click', () => { window.location.href = rutasNavegacionAndEnlacesMcpixel.inicio; });
document.getElementById('btnAuthLoginMenu').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.login);
document.getElementById('btnAuthRegistroMenu').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.register);
document.getElementById('menuLinkInicio').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.inicio);
document.getElementById('menuLinkExplorar').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.explorar);
document.getElementById('menuLinkPerfil').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.profile);
document.getElementById('menuLinkFavoritos').setAttribute('href', rutasNavegacionAndEnlacesMcpixel.favorites);

const perfilBtn = document.getElementById('perfilBtn');
const sidebarMenu = document.getElementById('sidebarMenu');
const toggleCollapseBtn = document.getElementById('toggleCollapseBtn');
const cuerpo = document.body;
let currentUser = null;

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
    } catch (error) {
        document.getElementById('contenedorAutenticacion').style.display = 'flex';
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

sidebarMenu.addEventListener('click', (e) => { e.stopPropagation(); });
document.addEventListener('click', () => { if (window.innerWidth < 768) sidebarMenu.classList.remove('activo'); });

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

function formatearNumero(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

async function obtenerUsuarioPorId(userId) {
    try {
        return await mcDB.obtenerPerfil(userId);
    } catch (e) {
        return null;
    }
}

async function obtenerAddonsPorCreador(creadorId) {
    try {
        return await mcDB.addonsDeUsuario(creadorId);
    } catch (e) {
        return [];
    }
}

function actualizarRedesSocialesPerfil(urls) {
    const urlDiscord = McShared.urlSegura(urls?.discord);
    const urlWhatsapp = McShared.urlSegura(urls?.whatsapp);
    const urlTiktok = McShared.urlSegura(urls?.tiktok);
    const urlYoutube = McShared.urlSegura(urls?.youtube);
    const urlWeb = McShared.urlSegura(urls?.web);

    const lnkDiscord = document.getElementById('lnkPerfilRedDiscord');
    const lnkWhatsapp = document.getElementById('lnkPerfilRedWhatsapp');
    const lnkTiktok = document.getElementById('lnkPerfilRedTiktok');
    const lnkYoutube = document.getElementById('lnkPerfilRedYoutube');
    const lnkWeb = document.getElementById('lnkPerfilRedWeb');

    if (urlDiscord.trim() !== "") {
        lnkDiscord.setAttribute('href', urlDiscord);
        lnkDiscord.style.display = 'flex';
    } else {
        lnkDiscord.style.display = 'none';
    }

    if (urlWhatsapp.trim() !== "") {
        lnkWhatsapp.setAttribute('href', urlWhatsapp);
        lnkWhatsapp.style.display = 'flex';
    } else {
        lnkWhatsapp.style.display = 'none';
    }

    if (urlTiktok.trim() !== "") {
        lnkTiktok.setAttribute('href', urlTiktok);
        lnkTiktok.style.display = 'flex';
    } else {
        lnkTiktok.style.display = 'none';
    }

    if (urlYoutube.trim() !== "") {
        lnkYoutube.setAttribute('href', urlYoutube);
        lnkYoutube.style.display = 'flex';
    } else {
        lnkYoutube.style.display = 'none';
    }

    if (urlWeb.trim() !== "") {
        lnkWeb.setAttribute('href', urlWeb);
        lnkWeb.style.display = 'flex';
    } else {
        lnkWeb.style.display = 'none';
    }
}

async function cargarPerfilUsuario() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    if (!userId) {
        document.getElementById('contenidoPerfil').style.display = 'none';
        document.getElementById('mensajeNoEncontrado').style.display = 'flex';
        return;
    }

    const usuario = await obtenerUsuarioPorId(userId);

    if (!usuario) {
        document.getElementById('contenidoPerfil').style.display = 'none';
        document.getElementById('mensajeNoEncontrado').style.display = 'flex';
        return;
    }

    document.title = usuario.nombre_visible + ' - ForgeGames';

    document.getElementById('contenidoPerfil').style.display = 'block';
    document.getElementById('mensajeNoEncontrado').style.display = 'none';

    const nombreVisible = usuario.nombre_visible || usuario.username || 'Usuario';
    const nombreUsuario = usuario.username || 'usuario';
    const biografia = usuario.bio || 'Sin biografía disponible.';

    document.getElementById('lblNombreVisible').textContent = nombreVisible;
    document.getElementById('lblNombreUsuario').textContent = nombreUsuario.startsWith('@') ? nombreUsuario : '@' + nombreUsuario;
    document.getElementById('lblBiografia').textContent = biografia;

    if (usuario.verificado === true) {
        document.getElementById('badgeVerificado').style.display = 'inline-flex';
    } else {
        document.getElementById('badgeVerificado').style.display = 'none';
    }

    if (usuario.avatar) {
        document.getElementById('perfilAvatarRaiz').innerHTML = `<img src="${McShared.esc(usuario.avatar)}" alt="Avatar">`;
    } else {
        document.getElementById('perfilAvatarRaiz').innerHTML = `<svg viewBox="0 0 24 24" id="svgAvatarPorDefecto"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    }

    if (usuario.banner) {
        document.getElementById('vistaBannerRaiz').innerHTML = `<img src="${McShared.esc(usuario.banner)}" alt="Banner">`;
    } else {
        document.getElementById('vistaBannerRaiz').innerHTML = '';
    }

    const redes = {
        discord: usuario.discord || '',
        whatsapp: usuario.whatsapp || '',
        tiktok: usuario.tiktok || '',
        youtube: usuario.youtube || '',
        web: usuario.web || ''
    };
    actualizarRedesSocialesPerfil(redes);

    const publicaciones = await obtenerAddonsPorCreador(userId);
    estadoPublicaciones.todas = publicaciones;
    estadoPublicaciones.tab = 'todo';
    estadoPublicaciones.orden = 'recientes';

    const tabPedida = new URLSearchParams(window.location.search).get('tab');
    if (tabPedida && McShared.TIPO_POR_ID[tabPedida] && publicaciones.some(p => McShared.tipoDe(p) === tabPedida)) {
        estadoPublicaciones.tab = tabPedida;
    }

    pintarEstadisticas();
    pintarTabs();
    pintarPublicaciones();
}

const estadoPublicaciones = { todas: [], tab: 'todo', orden: 'recientes' };
const T = McShared;

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

function tarjetaNormal(pub) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-premium-addon';
    tarjeta.addEventListener('click', () => {
        window.location.href = rutasNavegacionAndEnlacesMcpixel.view + '?id=' + pub.id;
    });

    const extras = [];
    const plat = T.tipoDe(pub) !== 'servidor' && pub.plataforma && T.PLATAFORMAS_SERVIDOR[pub.plataforma];
    if (plat) extras.push('<span class="etiqueta-mini plataforma">' + T.esc(plat) + '</span>');
    listaEtiquetas(pub).slice(0, 3).forEach(et => extras.push('<span class="etiqueta-mini">#' + T.esc(et) + '</span>'));

    tarjeta.innerHTML = T.cardInterior(pub, { usarBanner: true, imgError: '../img/icons/ic5.png' }) +
        (extras.length ? '<div class="perfil-tarjeta-extra">' + extras.join('') + '</div>' : '');
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

    let accionPrincipal = '';
    const enlaceRealm = T.urlSegura(srv.realm_enlace);
    if (esRealm) {
        accionPrincipal = enlaceRealm
            ? '<a class="srv-btn" href="' + T.esc(enlaceRealm) + '" target="_blank" rel="noopener noreferrer">Unirse</a>'
            : '';
    } else if (srv.ip) {
        accionPrincipal = '<button type="button" class="srv-btn srv-copiar" data-ip="' + T.esc(T.textoIp(srv)) + '">Copiar</button>';
    }

    const redes = [];
    if (T.urlSegura(srv.web_url)) redes.push(['Web', srv.web_url]);
    if (T.urlSegura(srv.discord_url)) redes.push(['Discord', srv.discord_url]);
    let extraRedes = {};
    try { extraRedes = JSON.parse(srv.redes || '{}') || {}; } catch (e) { extraRedes = {}; }
    Object.keys(extraRedes).forEach(k => {
        if (T.urlSegura(extraRedes[k])) redes.push([k.replace('_url', '').replace(/^./, c => c.toUpperCase()), extraRedes[k]]);
    });
    const htmlRedes = redes.slice(0, 4).map(r =>
        '<a class="srv-enlace" href="' + T.esc(r[1]) + '" target="_blank" rel="noopener noreferrer nofollow">' + T.esc(r[0]) + '</a>'
    ).join('');

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
            '<div class="srv-ip"><code title="Dirección del servidor">' + T.esc(textoIp) + '</code>' + accionPrincipal + '</div>' +
            '<p class="srv-desc">' + T.esc(srv.descripcion || 'Sin descripción disponible.') + '</p>' +
            '<div class="srv-datos">' + datos.map(d => '<div class="srv-dato"><small>' + T.esc(d[0]) + '</small><span>' + T.esc(d[1]) + '</span></div>').join('') + '</div>' +
            (tags ? '<div class="srv-tags">' + tags + '</div>' : '') +
            (htmlRedes ? '<div class="srv-pie">' + htmlRedes + '</div>' : '') +
        '</div>';

    tarjeta.addEventListener('click', () => {
        window.location.href = rutasNavegacionAndEnlacesMcpixel.view + '?id=' + srv.id;
    });
    tarjeta.querySelectorAll('a').forEach(a => a.addEventListener('click', e => e.stopPropagation()));
    const btnCopiar = tarjeta.querySelector('.srv-copiar');
    if (btnCopiar) {
        btnCopiar.addEventListener('click', async (e) => {
            e.stopPropagation();
            const ip = btnCopiar.dataset.ip;
            try {
                await navigator.clipboard.writeText(ip);
            } catch (err) {
                const tmp = document.createElement('textarea');
                tmp.value = ip;
                document.body.appendChild(tmp);
                tmp.select();
                try { document.execCommand('copy'); } catch (e2) { }
                tmp.remove();
            }
            btnCopiar.textContent = '¡Copiada!';
            btnCopiar.classList.add('copiado');
            setTimeout(() => { btnCopiar.textContent = 'Copiar'; btnCopiar.classList.remove('copiado'); }, 1600);
        });
    }
    return tarjeta;
}

function pintarPublicaciones() {
    const grid = document.getElementById('gridAddonsUsuario');
    const vacio = document.getElementById('estadoVacioAddons');
    const titulo = document.getElementById('tituloPublicaciones');
    const tab = estadoPublicaciones.tab;
    const enTab = tab === 'todo' ? estadoPublicaciones.todas : estadoPublicaciones.todas.filter(p => T.tipoDe(p) === tab);

    titulo.textContent = tab === 'todo' ? 'Publicaciones' : T.TIPO_POR_ID[tab].plural + ' publicados';

    const optDescargas = document.querySelector('#selOrden option[value="descargas"]');
    if (optDescargas) optDescargas.hidden = tab === 'servidor';
    if (tab === 'servidor' && estadoPublicaciones.orden === 'descargas') {
        estadoPublicaciones.orden = 'recientes';
        document.getElementById('selOrden').value = 'recientes';
    }

    if (enTab.length === 0) {
        vacio.style.display = 'flex';
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

(async function iniciarApp() {
    inicializarPantalla();
    await verificarSesion();
    await cargarPerfilUsuario();
})();
