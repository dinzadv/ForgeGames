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

const statAddons = document.getElementById('statAddons');
const statDescargas = document.getElementById('statDescargas');
const statLikes = document.getElementById('statLikes');
const estadoVacioAddons = document.getElementById('estadoVacioAddons');
const gridAddonsUsuario = document.getElementById('gridAddonsUsuario');

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

/* ---------- Confirmación de eliminar (con cuenta regresiva de 5 s) ---------- */
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

async function cargarAddonsDelUsuario(userId, forzar) {
    try {
        const addons = await mcDB.addonsDeUsuario(userId, forzar);

        let totalDescargas = 0;
        let totalLikes = 0;

        addons.forEach(addon => {
            totalDescargas += parseInt(addon.descargas) || 0;
            totalLikes += parseInt(addon.likes) || 0;
        });

        statAddons.textContent = addons.length;
        statDescargas.textContent = formatearNumero(totalDescargas);
        statLikes.textContent = formatearNumero(totalLikes);

        if (addons.length === 0) {
            estadoVacioAddons.style.display = 'flex';
            gridAddonsUsuario.style.display = 'none';
            return;
        }

        estadoVacioAddons.style.display = 'none';
        gridAddonsUsuario.style.display = 'grid';
        gridAddonsUsuario.innerHTML = '';

        addons.forEach(addon => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-premium-addon';
            const fecha = addon.fecha ? new Date(addon.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Reciente';

            let urlPortada = "../img/icons/ic5.png"; 
            if (addon.portada) {
                urlPortada = addon.portada;
            }

            tarjeta.innerHTML = `
                ${McShared.cardInterior(addon, { usarBanner: true, imgError: '../img/icons/ic5.png' })}
                <div class="addon-acciones-botones">
                    <a href="${rutasNavegacionAndEnlacesMcpixel.view}?id=${addon.id}" class="btn-addon-accion ver" title="Ver">
                        <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </a>
                    <a href="${rutasNavegacionAndEnlacesMcpixel.postEdit}?id=${addon.id}" class="btn-addon-accion editar" title="Editar">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </a>
                    <button class="btn-addon-accion eliminar" data-id="${addon.id}" title="Eliminar">
                        <svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;

            tarjeta.querySelector('.eliminar').addEventListener('click', async (e) => {
                e.stopPropagation();
                const nombreTipo = McShared.TIPO_POR_ID[McShared.tipoDe(addon)].nombre;
                if (await confirmarEliminacion(nombreTipo, addon.nombre)) {
                    try {
                        const { data: borrados, error: errorBorrar } = await mcDB
                            .from('addons')
                            .delete()
                            .eq('id', addon.id)
                            .select('id');
                        if (errorBorrar) throw errorBorrar;
                        if (!borrados || borrados.length === 0) throw new Error('No se pudo eliminar la publicación.');

                        // La publicación ya no existe: se borran también sus imágenes de Storage
                        await mcDB.imagenes.borrar(urlsImagenesDe(addon));
                        mcDB.invalidarContenido();

                        await cargarAddonsDelUsuario(userId, true);
                    } catch (err) {
                        alert("Error al eliminar Addon: " + err.message);
                    }
                }
            });

            gridAddonsUsuario.appendChild(tarjeta);
        });

    } catch (error) {
        console.error("Error cargando addons:", error);
        estadoVacioAddons.style.display = 'flex';
        estadoVacioAddons.querySelector('p').textContent = 'Error al cargar los add-ons.';
        gridAddonsUsuario.style.display = 'none';
    }
}

// Acepta "https://..." o un dominio suelto (se le antepone https://). Vacío = sin enlace.
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

        // 1) Si eligió una foto / banner nuevos: se comprimen y se suben a Storage
        if (archivoAvatarSeleccionado) {
            urlAvatarFinal = await imagenes.subir('avatars', archivoAvatarSeleccionado);
        }
        if (archivoBannerSeleccionado) {
            urlBannerFinal = await imagenes.subir('perfil-banners', archivoBannerSeleccionado);
        }

        // 2) Guardar el perfil
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

        // 3) Guardado correcto: se borran de Storage la foto / banner anteriores si fueron reemplazados
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
