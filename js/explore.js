const rutasNavegacionAndEnlacesMcpixel = {
    login: "../login/",
    register: "../register/",
    inicio: "../",
    explorar: "../explore/",
    profile: "../profile/",
    view: "../view/",
    post: "../post/",
    favorites: "../favorites/",
    profileView: "../user/"
};

document.getElementById('logoInicio').addEventListener('click', () => {
    window.location.href = rutasNavegacionAndEnlacesMcpixel.inicio;
});
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

function formatearNumero(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function mezclarArreglo(arreglo) {
    const copia = [...arreglo];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

async function obtenerAddonsPublicados() {
    try {
        return await mcDB.listarAddons();
    } catch (e) {
        return [];
    }
}

async function obtenerUsuarios() {
    try {
        return await mcDB.listarUsuarios();
    } catch (e) {
        return [];
    }
}

const CLAVE_BUSQUEDAS_RECIENTES = 'mcpixel_busquedas_recientes';

function obtenerBusquedasRecientes() {
    let busquedas = [];
    try {
        const data = localStorage.getItem(CLAVE_BUSQUEDAS_RECIENTES);
        if (data) busquedas = JSON.parse(data);
    } catch (e) {
        busquedas = [];
    }
    return busquedas;
}

function guardarBusquedaReciente(texto) {
    if (!texto || texto.trim() === '') return;
    const textoLimpio = texto.trim();
    let busquedas = obtenerBusquedasRecientes();
    busquedas = busquedas.filter(b => b.toLowerCase() !== textoLimpio.toLowerCase());
    busquedas.unshift(textoLimpio);
    if (busquedas.length > 10) busquedas = busquedas.slice(0, 10);
    localStorage.setItem(CLAVE_BUSQUEDAS_RECIENTES, JSON.stringify(busquedas));
    renderizarBusquedasRecientes();
}

function eliminarBusquedaReciente(texto) {
    let busquedas = obtenerBusquedasRecientes();
    busquedas = busquedas.filter(b => b.toLowerCase() !== texto.toLowerCase());
    localStorage.setItem(CLAVE_BUSQUEDAS_RECIENTES, JSON.stringify(busquedas));
    renderizarBusquedasRecientes();
}

const buscadorInput = document.getElementById('buscadorInput');
const placeholderAnimado = document.getElementById('placeholderAnimado');
const resultadosGrid = document.getElementById('resultadosGrid');
const badgeAddons = document.getElementById('badgeAddons');
const badgeUsuarios = document.getElementById('badgeUsuarios');
const tabs = document.querySelectorAll('.filtro-tab');
const busquedasRecientes = document.getElementById('busquedasRecientes');
const listaBusquedasRecientes = document.getElementById('listaBusquedasRecientes');
const btnFiltrosDropdown = document.getElementById('btnFiltrosDropdown');
const filtroDropdownMenu = document.getElementById('filtroDropdownMenu');
const opcionesFiltro = document.querySelectorAll('.filtro-opcion');
const quisisteDecirContenedor = document.getElementById('quisisteDecirContenedor');
const recomendadosContenedor = document.getElementById('recomendadosContenedor');

let tabActual = 'addons';
let ordenActual = 'defecto';
let todosLosAddons = [];
let tipoExplore = 'todos';

function addonsDelTipo() {
    if (tipoExplore === 'todos') return todosLosAddons;
    return todosLosAddons.filter(a => McShared.tipoDe(a) === tipoExplore);
}
let todosLosUsuarios = [];
let listaNombresPlaceholder = [];
let indicePlaceholder = 0;
let intervaloPlaceholder = null;
let busquedasAbierto = false;

btnFiltrosDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    filtroDropdownMenu.classList.toggle('activo');
    btnFiltrosDropdown.classList.toggle('activo');
});

document.addEventListener('click', (e) => {
    if (!btnFiltrosDropdown.contains(e.target) && !filtroDropdownMenu.contains(e.target)) {
        filtroDropdownMenu.classList.remove('activo');
        btnFiltrosDropdown.classList.remove('activo');
    }
});

opcionesFiltro.forEach(opcion => {
    opcion.addEventListener('click', () => {
        opcionesFiltro.forEach(o => o.classList.remove('seleccionada'));
        opcion.classList.add('seleccionada');
        ordenActual = opcion.dataset.sort;
        filtroDropdownMenu.classList.remove('activo');
        btnFiltrosDropdown.classList.remove('activo');
        actualizarEstadoYBuscar();
    });
});

function renderizarBusquedasRecientes() {
    const busquedas = obtenerBusquedasRecientes();
    listaBusquedasRecientes.innerHTML = '';

    if (busquedas.length === 0) {
        busquedasRecientes.classList.remove('activo');
        return;
    }

    busquedas.forEach(busqueda => {
        const item = document.createElement('div');
        item.className = 'busqueda-reciente-item';
        item.innerHTML = `
            <svg class="icono-lupa-pequena" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span class="texto-busqueda">${busqueda}</span>
            <button class="btn-eliminar-busqueda">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;

        item.querySelector('.texto-busqueda').addEventListener('click', () => {
            buscadorInput.value = busqueda;
            actualizarEstadoYBuscar();
            busquedasRecientes.classList.remove('activo');
            busquedasAbierto = false;
        });

        item.querySelector('.btn-eliminar-busqueda').addEventListener('click', (e) => {
            e.stopPropagation();
            eliminarBusquedaReciente(busqueda);
        });

        listaBusquedasRecientes.appendChild(item);
    });

    busquedasRecientes.classList.add('activo');
}

function ordenarAddons(lista, criterio) {
    let copia = [...lista];
    if (criterio === 'defecto') {
        return mezclarArreglo(copia);
    } else if (criterio === 'reciente') {
        return copia.sort((a, b) => new Date(b.created_at || b.fecha || 0) - new Date(a.created_at || a.fecha || 0));
    } else if (criterio === 'actualizado') {
        return copia.sort((a, b) => new Date(b.updated_at || b.created_at || b.fecha || 0) - new Date(a.updated_at || a.created_at || a.fecha || 0));
    } else if (criterio === 'valorados') {
        return copia.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (criterio === 'descargados') {
        return copia.sort((a, b) => (b.descargas || 0) - (a.descargas || 0));
    }
    return copia;
}

function ordenarUsuarios(lista, criterio) {
    let copia = [...lista];
    if (criterio === 'defecto') {
        return mezclarArreglo(copia);
    } else if (criterio === 'reciente') {
        return copia.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (criterio === 'valorados' || criterio === 'descargados') {
        return copia.sort((a, b) => (b.verificado ? 1 : 0) - (a.verificado ? 1 : 0));
    }
    return mezclarArreglo(copia);
}

async function cargarDatos() {
    const addons = await obtenerAddonsPublicados();
    const usuarios = await obtenerUsuarios();

    todosLosAddons = addons;
    todosLosUsuarios = usuarios;

    const nombresAddons = todosLosAddons.map(a => a.nombre || 'Complemento').filter(n => n);
    const nombresUsuarios = todosLosUsuarios.map(u => u.nombre_visible || u.username || 'Usuario').filter(n => n);

    const todosLosNombres = [...nombresAddons, ...nombresUsuarios];

    listaNombresPlaceholder = todosLosNombres.length > 0 ? todosLosNombres : ['Motosierras', 'Demonios', 'Magia', 'Aventura', 'Explorar', 'Minecraft', 'Complementos'];

    badgeAddons.textContent = todosLosAddons.length;
    badgeUsuarios.textContent = todosLosUsuarios.length;

    iniciarAnimacionPlaceholder();
    renderizarBusquedasRecientes();

    leerParametrosURLYRestaurar();
}

function iniciarAnimacionPlaceholder() {
    if (intervaloPlaceholder) clearInterval(intervaloPlaceholder);

    const nombres = listaNombresPlaceholder;
    if (nombres.length === 0) {
        placeholderAnimado.textContent = 'Buscar: ...';
        return;
    }

    indicePlaceholder = 0;
    placeholderAnimado.textContent = 'Buscar: ' + nombres[0];

    intervaloPlaceholder = setInterval(() => {
        indicePlaceholder = (indicePlaceholder + 1) % nombres.length;
        placeholderAnimado.textContent = 'Buscar: ' + nombres[indicePlaceholder];
    }, 2500);
}

function crearTarjetaAddonHTML(addon) {
    const fecha = addon.fecha ? new Date(addon.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Reciente';
    const descripcion = addon.descripcion || 'Sin descripción disponible.';
    const portadaUrl = addon.portada || '';

    return `
        <div class="tarjeta-premium-addon" onclick="guardarPosicionYNavegar('${rutasNavegacionAndEnlacesMcpixel.view}?id=${addon.id}')">
            ${McShared.cardInterior(addon, { usarBanner: true })}
        </div>
    `;
}

function crearTarjetaUsuarioHTML(usuario) {
    const nombreVisible = usuario.nombre_visible || usuario.username || 'Usuario';
    const nombreUsuario = usuario.username || '@usuario';
    const avatarUrl = usuario.avatar || '';
    const isVerified = usuario.verificado || false;

    let avatarHtml = '';
    if (avatarUrl) {
        avatarHtml = `<img src="${McShared.esc(avatarUrl)}" alt="Avatar">`;
    } else {
        avatarHtml = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    }

    const verifiedClass = isVerified ? 'visible' : '';

    return `
        <div class="usuario-resultado" onclick="guardarPosicionYNavegar('${rutasNavegacionAndEnlacesMcpixel.profileView}?id=${usuario.id}')">
            <div class="usuario-avatar">${avatarHtml}</div>
            <div class="usuario-info">
                <span class="usuario-nombre-visible">${nombreVisible}</span>
                <div class="usuario-nombre-wrapper">
                    <span class="usuario-nombre">${nombreUsuario.startsWith('@') ? nombreUsuario : '@' + nombreUsuario}</span>
                    <span class="usuario-badge-verificado ${verifiedClass}">
                        <svg viewBox="0 0 24 24"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-4.01s-2.62-1.27-4.01-.81C14.67 2.53 13.43 1.65 12 1.65s-2.67.88-3.34 2.19c-1.39-.46-2.97-.2-4.01.81s-1.27 2.62-.81 4.01C2.53 9.33 1.65 10.57 1.65 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.97.81 4.01s2.62 1.27 4.01.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.97.2 4.01-.81s1.27-2.62.81-4.01c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>
                    </span>
                </div>
            </div>
        </div>
    `;
}

function guardarPosicionYNavegar(url) {
    sessionStorage.setItem('mcpixel_explore_scroll', window.scrollY);
    window.location.href = url;
}

function mostrarAddons(addons) {
    resultadosGrid.innerHTML = '';
    if (!addons || addons.length === 0) {
        resultadosGrid.innerHTML = `
            <div class="mensaje-sin-resultados" style="grid-column: 1 / -1;">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>No se encontraron resultados</span>
                <span class="sub">Prueba con otra palabra clave</span>
            </div>
        `;
        return;
    }
    addons.forEach(addon => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = crearTarjetaAddonHTML(addon);
        resultadosGrid.appendChild(tempDiv.firstElementChild);
    });
}

function mostrarUsuarios(usuarios) {
    resultadosGrid.innerHTML = '';
    if (!usuarios || usuarios.length === 0) {
        resultadosGrid.innerHTML = `
            <div class="mensaje-sin-resultados" style="grid-column: 1 / -1;">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>No se encontraron resultados</span>
                <span class="sub">Prueba con otra palabra clave</span>
            </div>
        `;
        return;
    }
    usuarios.forEach(usuario => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = crearTarjetaUsuarioHTML(usuario);
        resultadosGrid.appendChild(tempDiv.firstElementChild);
    });
}

function calcularSimilitud(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.7;
    let coincidencias = 0;
    const palabrasA = a.split(' ');
    const palabrasB = b.split(' ');
    palabrasA.forEach(pa => {
        palabrasB.forEach(pb => {
            if (pa && pb && (pa.includes(pb) || pb.includes(pa))) coincidencias++;
        });
    });
    return coincidencias > 0 ? 0.5 : 0;
}

function obtenerSugerenciaQuisisteDecir(texto) {
    let mejorCoincidencia = null;
    let mayorPuntaje = 0;

    todosLosAddons.forEach(a => {
        const nombre = a.nombre || '';
        const puntaje = calcularSimilitud(texto, nombre);
        if (puntaje > mayorPuntaje) {
            mayorPuntaje = puntaje;
            mejorCoincidencia = nombre;
        }
    });

    todosLosUsuarios.forEach(u => {
        const nombre = u.nombre_visible || u.username || '';
        const puntaje = calcularSimilitud(texto, nombre);
        if (puntaje > mayorPuntaje) {
            mayorPuntaje = puntaje;
            mejorCoincidencia = nombre;
        }
    });

    return mayorPuntaje >= 0.4 ? mejorCoincidencia : null;
}

function renderizarRecomendaciones(textoBusqueda) {
    recomendadosContenedor.innerHTML = '';

    let htmlRecomendados = `<div class="seccion-recomendados">`;

    let addonsRecomendados = mezclarArreglo(todosLosAddons).slice(0, 6);
    if (addonsRecomendados.length > 0) {
        htmlRecomendados += `
            <div class="titulo-seccion-recomendados">
                <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:none;stroke:var(--color-acento);stroke-width:2;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>Complementos que te podrían interesar</span>
            </div>
            <div class="grid-resultados" style="margin-bottom: 32px;">
                ${addonsRecomendados.map(a => crearTarjetaAddonHTML(a)).join('')}
            </div>
        `;
    }

    let usuariosRecomendados = mezclarArreglo(todosLosUsuarios).slice(0, 3);
    if (usuariosRecomendados.length > 0) {
        htmlRecomendados += `
            <div class="titulo-seccion-recomendados">
                <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:none;stroke:var(--color-acento);stroke-width:2;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Perfiles sugeridos</span>
            </div>
            <div class="grid-resultados">
                ${usuariosRecomendados.map(u => crearTarjetaUsuarioHTML(u)).join('')}
            </div>
        `;
    }

    htmlRecomendados += `</div>`;
    recomendadosContenedor.innerHTML = htmlRecomendados;
}

function buscar(query) {
    const texto = query.toLowerCase().trim();
    const filaTipos = document.getElementById('filtrosTipo');
    if (filaTipos) filaTipos.classList.toggle('oculto', tabActual !== 'addons');
    quisisteDecirContenedor.innerHTML = '';
    recomendadosContenedor.innerHTML = '';

    if (texto === '') {
        if (tabActual === 'addons') {
            mostrarAddons(ordenarAddons(addonsDelTipo(), ordenActual));
        } else {
            mostrarUsuarios(ordenarUsuarios(todosLosUsuarios, ordenActual));
        }
        return;
    }

    let resultados = [];

    if (tabActual === 'addons') {
        resultados = addonsDelTipo().filter(addon => {
            const nombre = (addon.nombre || '').toLowerCase();
            const descripcion = (addon.descripcion || '').toLowerCase();
            const etiquetas = (addon.etiquetas || '').toLowerCase();
            const direccion = (addon.ip || '').toLowerCase();
            return nombre.includes(texto) || descripcion.includes(texto) || etiquetas.includes(texto) || direccion.includes(texto);
        });

        if (resultados.length > 0) {
            mostrarAddons(ordenarAddons(resultados, ordenActual));
        } else {
            const sugerencia = obtenerSugerenciaQuisisteDecir(texto);
            if (sugerencia) {
                quisisteDecirContenedor.innerHTML = `
                    <div class="quisiste-decir-contenedor">
                        ¿Quisiste decir <button class="btn-quisiste-decir" onclick="aplicarSugerencia('${sugerencia.replace(/'/g, "\\'")}')">${sugerencia}</button>?
                    </div>
                `;
            }
            mostrarAddons([]);
            renderizarRecomendaciones(texto);
        }
    } else {
        resultados = todosLosUsuarios.filter(usuario => {
            const nombreVisible = (usuario.nombre_visible || '').toLowerCase();
            const username = (usuario.username || '').toLowerCase();
            return nombreVisible.includes(texto) || username.includes(texto);
        });

        if (resultados.length > 0) {
            mostrarUsuarios(ordenarUsuarios(resultados, ordenActual));
        } else {
            const sugerencia = obtenerSugerenciaQuisisteDecir(texto);
            if (sugerencia) {
                quisisteDecirContenedor.innerHTML = `
                    <div class="quisiste-decir-contenedor">
                        ¿Quisiste decir <button class="btn-quisiste-decir" onclick="aplicarSugerencia('${sugerencia.replace(/'/g, "\\'")}')">${sugerencia}</button>?
                    </div>
                `;
            }
            mostrarUsuarios([]);
            renderizarRecomendaciones(texto);
        }
    }
}

function aplicarSugerencia(texto) {
    buscadorInput.value = texto;
    actualizarEstadoYBuscar();
}

function actualizarURL() {
    const url = new URL(window.location.href);
    const query = buscadorInput.value.trim();

    if (query) {
        url.searchParams.set('q', query);
    } else {
        url.searchParams.delete('q');
    }

    if (tabActual !== 'addons') {
        url.searchParams.set('tab', tabActual);
    } else {
        url.searchParams.delete('tab');
    }

    if (ordenActual !== 'defecto') {
        url.searchParams.set('sort', ordenActual);
    } else {
        url.searchParams.delete('sort');
    }

    window.history.replaceState({}, '', url.toString());
}

function actualizarEstadoYBuscar() {
    actualizarURL();
    buscar(buscadorInput.value);
}

function leerParametrosURLYRestaurar() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const tab = params.get('tab') || 'addons';
    const sort = params.get('sort') || 'defecto';

    buscadorInput.value = q;
    tabActual = tab;
    ordenActual = sort;

    tabs.forEach(t => {
        if (t.dataset.tab === tabActual) {
            t.classList.add('activo');
        } else {
            t.classList.remove('activo');
        }
    });

    opcionesFiltro.forEach(o => {
        if (o.dataset.sort === ordenActual) {
            o.classList.add('seleccionada');
        } else {
            o.classList.remove('seleccionada');
        }
    });

    buscar(q);

    const savedScroll = sessionStorage.getItem('mcpixel_explore_scroll');
    if (savedScroll !== null) {
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedScroll, 10));
            sessionStorage.removeItem('mcpixel_explore_scroll');
        }, 100);
    }
}

buscadorInput.addEventListener('focus', () => {
    renderizarBusquedasRecientes();
    busquedasAbierto = true;
});

buscadorInput.addEventListener('blur', () => {
    setTimeout(() => {
        busquedasRecientes.classList.remove('activo');
        busquedasAbierto = false;
    }, 200);
});

buscadorInput.addEventListener('input', (e) => {
    const valor = e.target.value;
    if (valor.trim() !== '') {
        busquedasRecientes.classList.remove('activo');
        busquedasAbierto = false;
    }
    actualizarEstadoYBuscar();
});

buscadorInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && buscadorInput.value.trim() !== '') {
        guardarBusquedaReciente(buscadorInput.value);
        busquedasRecientes.classList.remove('activo');
        busquedasAbierto = false;
        actualizarEstadoYBuscar();
    }
});

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('activo'));
        tab.classList.add('activo');
        tabActual = tab.dataset.tab;
        actualizarEstadoYBuscar();
    });
});

(async function iniciarApp() {
    inicializarPantalla();
    await verificarSesion();
    await cargarDatos();
})();

document.querySelectorAll('#filtrosTipo .chip-tipo-filtro').forEach(chip => {
    chip.addEventListener('click', () => {
        tipoExplore = chip.dataset.tipo;
        document.querySelectorAll('#filtrosTipo .chip-tipo-filtro').forEach(c => c.classList.toggle('activo', c === chip));
        actualizarEstadoYBuscar();
    });
});
