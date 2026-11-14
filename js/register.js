let usuarioDisponible = false;
const USUARIO_VALIDO = /^[a-z0-9_]{3,20}$/;
let timeoutBusqueda = null;

function alternarVisibilidadRegPassword(idCampo, idIcono) {
    const campoPassword = document.getElementById(idCampo);
    const iconoOjo = document.getElementById(idIcono);

    if (campoPassword.type === 'password') {
        campoPassword.type = 'text';
        iconoOjo.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
    } else {
        campoPassword.type = 'password';
        iconoOjo.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
}

function transicionSalida(e, url) {
    e.preventDefault();
    const contenedor = document.getElementById('contenedorPrincipal');
    contenedor.classList.add('animacion-salida');
    setTimeout(function() {
        window.location.href = url;
    }, 350);
}

function verificarDisponibilidadUsuario() {
    const usuarioInput = document.getElementById('regUsuario').value.trim().toLowerCase();
    const feedback = document.getElementById('regUsuarioFeedback');

    if (usuarioInput === '') {
        feedback.style.display = 'none';
        usuarioDisponible = false;
        return;
    }

    feedback.style.display = 'block';

    if (!USUARIO_VALIDO.test(usuarioInput)) {
        clearTimeout(timeoutBusqueda);
        feedback.className = 'msg-validacion msg-error';
        feedback.style.color = '';
        feedback.textContent = 'Usa de 3 a 20 caracteres: letras minúsculas, números o _';
        usuarioDisponible = false;
        return;
    }

    feedback.className = 'msg-validacion';
    feedback.style.color = '#94a3b8';
    feedback.textContent = 'Verificando...';

    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(async () => {
        try {
            const { data, error } = await mcDB
                .from('users')
                .select('username')
                .eq('username', usuarioInput);

            if (error) throw error;

            feedback.style.color = '';
            if (data && data.length > 0) {
                feedback.className = 'msg-validacion msg-error';
                feedback.textContent = 'El nombre ya está en uso';
                usuarioDisponible = false;
            } else {
                feedback.className = 'msg-validacion msg-exito';
                feedback.textContent = 'Nombre de usuario disponible';
                usuarioDisponible = true;
            }
        } catch (error) {
            feedback.style.display = 'none';
            usuarioDisponible = true;
        }
    }, 500);
}

async function procesarRegistro(e) {
    e.preventDefault();

    const nombreVisible = document.getElementById('regNombreVisible').value.trim();
    const usuario = document.getElementById('regUsuario').value.trim().toLowerCase();
    const contrasena = document.getElementById('regContrasena').value;
    const confirmarContrasena = document.getElementById('regConfirmarContrasena').value;

    const errorConfirmacion = document.getElementById('errorConfirmacion');
    errorConfirmacion.style.display = 'none';

    if (contrasena !== confirmarContrasena) {
        errorConfirmacion.style.display = 'block';
        return;
    }

    if (contrasena.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    if (!usuarioDisponible || !USUARIO_VALIDO.test(usuario)) {
        return;
    }

    const emailFantasma = `${usuario}@mcpixel.com`;
    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.textContent = 'Registrando...';
    btnSubmit.disabled = true;

    try {
        const { data, error } = await mcDB.auth.signUp({
            email: emailFantasma,
            password: contrasena,
            options: {
                data: {
                    username: usuario,
                    nombre_visible: nombreVisible,
                    avatar: ''
                }
            }
        });

        if (error) throw error;
        if (!data.session) {
            throw new Error('La cuenta se creó, pero no se pudo iniciar sesión. Desactiva "Confirm email" en Supabase (Authentication > Sign In / Providers > Email).');
        }

        mcDB.invalidarPerfil();
        localStorage.setItem('mcpixel_interfaz_v2_sesion', nombreVisible);
        window.location.href = '../';

    } catch (error) {
        btnSubmit.textContent = 'Registrarse';
        btnSubmit.disabled = false;

        if (/already registered|Database error/i.test(error.message)) {
            alert('Este nombre de usuario ya existe en el sistema. Por favor, intenta con otro.');
        } else {
            alert(error.message);
        }
    }
}
