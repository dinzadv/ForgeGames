function destinoTrasSesion() {
    try {
        const v = sessionStorage.getItem('fg_volver');
        sessionStorage.removeItem('fg_volver');
        if (v && v.charAt(0) === '/' && v.charAt(1) !== '/' && v.charAt(1) !== '\\' && !/[\r\n]/.test(v)) return v;
    } catch (e) { }
    return '../';
}

function alternarVisibilidadPassword() {
    const campoPassword = document.getElementById('loginContrasena');
    const iconoOjo = document.getElementById('iconoOjo');

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

async function procesarLogin(e) {
    e.preventDefault();

    const usuarioInput = document.getElementById('loginUsuario').value.trim().toLowerCase();
    const contrasenaInput = document.getElementById('loginContrasena').value;

    const errorUsuario = document.getElementById('errorUsuario');
    const errorContrasena = document.getElementById('errorContrasena');
    const btnSubmit = document.getElementById('btnSubmit');

    errorUsuario.style.display = 'none';
    errorContrasena.style.display = 'none';
    btnSubmit.textContent = 'Entrando...';
    btnSubmit.disabled = true;

    const emailFantasma = `${usuarioInput}@mcpixel.com`;

    try {
        const { data: usuarioData, error: usuarioError } = await mcDB
            .from('users')
            .select('id,username,nombre_visible,avatar')
            .eq('username', usuarioInput)
            .maybeSingle();

        if (usuarioError) throw usuarioError;

        if (!usuarioData) {
            errorUsuario.style.display = 'block';
            btnSubmit.textContent = 'Entrar';
            btnSubmit.disabled = false;
            return;
        }

        const { data: authData, error: authError } = await mcDB.auth.signInWithPassword({
            email: emailFantasma,
            password: contrasenaInput
        });

        if (authError) {
            if (authError.message.includes('Invalid login credentials')) {
                errorContrasena.style.display = 'block';
            } else {
                alert(authError.message);
            }
            btnSubmit.textContent = 'Entrar';
            btnSubmit.disabled = false;
            return;
        }

        const nombreFinal = usuarioData.nombre_visible || usuarioData.username;
        const avatarFinal = usuarioData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
        mcDB.invalidarPerfil(usuarioData.id);

        localStorage.setItem('mcpixel_interfaz_v2_sesion', nombreFinal);
        localStorage.setItem('mcpixel_interfaz_v2_avatar', avatarFinal);

        window.location.href = destinoTrasSesion();

    } catch (error) {
        console.error(error);
        alert('Error al intentar iniciar sesión.');
        btnSubmit.textContent = 'Entrar';
        btnSubmit.disabled = false;
    }
}
