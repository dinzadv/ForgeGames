-- =====================================================================
--  ForgeGames · Esquema completo para Supabase
--  Proyecto: (tu proyecto de Supabase)
--
--  CÓMO USARLO
--   1) Supabase > SQL Editor > New query > pega TODO este archivo > Run.
--   2) Authentication > Sign In / Providers > Email:
--        desactiva "Confirm email"  (la app crea cuentas con usuario@mcpixel.com,
--        que no son correos reales, así que no se pueden confirmar).
--   3) Listo. Es seguro volver a ejecutarlo (usa IF NOT EXISTS / OR REPLACE).
--
--  QUÉ CREA
--   · Tablas: tipos_publicacion, monedas, users, addons, likes, favorites,
--             descargas_log
--   · Triggers: perfil automático al registrarse, contadores de likes,
--               protección de campos (likes, descargas, verificado...)
--   · Función segura: registrar_descarga()
--   · RLS en todas las tablas + GRANTs explícitos
--   · Buckets de Storage: avatars, perfil-banners, portadas, banners, galeria
--     con políticas: cada usuario solo escribe dentro de su carpeta <user_id>/
-- =====================================================================


-- =====================================================================
-- 1) CATÁLOGOS (datos reales tomados de js/mcshared.js)
-- =====================================================================
create table if not exists public.tipos_publicacion (
    id          text primary key,
    cat_id      text not null unique,
    nombre      text not null,
    plural      text not null,
    descripcion text not null,
    orden       smallint not null default 0
);

create table if not exists public.monedas (
    codigo  text primary key check (codigo ~ '^[A-Z]{3}$'),
    nombre  text not null,
    pais    text not null,
    simbolo text not null
);

insert into public.tipos_publicacion (id, cat_id, nombre, plural, descripcion, orden) values
('addon', 'addons', 'Add-On', 'Add-Ons', 'Mecánicas, armas y comportamientos nuevos para jugar distinto.', 1),
('modelo', 'modelos', 'Modelo', 'Modelos', 'Entidades, bloques y objetos 3D con forma propia.', 2),
('sprites', 'sprites', 'Menús y Sprites', 'Sprites/Menús', 'Interfaces, menús, iconos y sprites para personalizar el juego.', 3),
('mapa', 'mapas', 'Mapa', 'Mapas', 'Mundos, aventuras y construcciones listos para jugar.', 4),
('servidor', 'servidores', 'Servidor', 'Servidores', 'Servidores de Java, Bedrock y Realms para jugar con otros.', 5)
on conflict (id) do update set
    cat_id = excluded.cat_id, nombre = excluded.nombre, plural = excluded.plural,
    descripcion = excluded.descripcion, orden = excluded.orden;

insert into public.monedas (codigo, nombre, pais, simbolo) values
('USD', 'Dólar estadounidense', 'Estados Unidos', '$'),
('EUR', 'Euro', 'Eurozona', '€'),
('MXN', 'Peso mexicano', 'México', '$'),
('ARS', 'Peso argentino', 'Argentina', '$'),
('COP', 'Peso colombiano', 'Colombia', '$'),
('CLP', 'Peso chileno', 'Chile', '$'),
('PEN', 'Sol peruano', 'Perú', 'S/'),
('BRL', 'Real brasileño', 'Brasil', 'R$'),
('VES', 'Bolívar venezolano', 'Venezuela', 'Bs.'),
('UYU', 'Peso uruguayo', 'Uruguay', '$U'),
('BOB', 'Boliviano', 'Bolivia', 'Bs'),
('PYG', 'Guaraní paraguayo', 'Paraguay', '₲'),
('DOP', 'Peso dominicano', 'Rep. Dominicana', 'RD$'),
('GTQ', 'Quetzal', 'Guatemala', 'Q'),
('CRC', 'Colón costarricense', 'Costa Rica', '₡'),
('HNL', 'Lempira', 'Honduras', 'L'),
('NIO', 'Córdoba', 'Nicaragua', 'C$'),
('PAB', 'Balboa', 'Panamá', 'B/.'),
('CUP', 'Peso cubano', 'Cuba', '$'),
('GBP', 'Libra esterlina', 'Reino Unido', '£'),
('CAD', 'Dólar canadiense', 'Canadá', '$'),
('AUD', 'Dólar australiano', 'Australia', '$'),
('CHF', 'Franco suizo', 'Suiza', 'CHF'),
('JPY', 'Yen japonés', 'Japón', '¥'),
('KRW', 'Won surcoreano', 'Corea del Sur', '₩'),
('CNY', 'Yuan chino', 'China', '¥'),
('INR', 'Rupia india', 'India', '₹'),
('IDR', 'Rupia indonesia', 'Indonesia', 'Rp'),
('PHP', 'Peso filipino', 'Filipinas', '₱'),
('TRY', 'Lira turca', 'Turquía', '₺'),
('PLN', 'Esloti polaco', 'Polonia', 'zł'),
('RUB', 'Rublo ruso', 'Rusia', '₽')
on conflict (codigo) do update set
    nombre = excluded.nombre, pais = excluded.pais, simbolo = excluded.simbolo;


-- =====================================================================
-- 2) TABLAS PRINCIPALES
-- =====================================================================

-- ---------- users (perfil público; 1 fila por cuenta de auth) ----------
create table if not exists public.users (
    id             uuid primary key references auth.users (id) on delete cascade,
    username       text not null,
    nombre_visible text not null default '',
    avatar         text not null default '',
    banner         text not null default '',
    bio            text not null default '',
    verificado     boolean not null default false,
    discord        text not null default '',
    whatsapp       text not null default '',
    tiktok         text not null default '',
    youtube        text not null default '',
    web            text not null default '',
    created_at     timestamptz not null default now(),
    updated_at     timestamptz,

    constraint users_username_formato check (username ~ '^[a-z0-9_]{3,20}$'),
    constraint users_nombre_largo     check (char_length(nombre_visible) <= 40),
    constraint users_bio_larga        check (char_length(bio) <= 500),
    -- imágenes: solo URL https sin comillas ni etiquetas (evita inyección en el HTML)
    constraint users_avatar_url check (avatar = '' or (char_length(avatar) <= 500 and avatar ~ '^https://[^\s"''<>]+$')),
    constraint users_banner_url check (banner = '' or (char_length(banner) <= 500 and banner ~ '^https://[^\s"''<>]+$')),
    -- enlaces: solo http(s) (evita javascript:)
    constraint users_discord_url check (discord = '' or (char_length(discord) <= 300 and discord ~* '^https?://[^\s"''<>]+$')),
    constraint users_whatsapp_url check (whatsapp = '' or (char_length(whatsapp) <= 300 and whatsapp ~* '^https?://[^\s"''<>]+$')),
    constraint users_tiktok_url  check (tiktok  = '' or (char_length(tiktok) <= 300 and tiktok ~* '^https?://[^\s"''<>]+$')),
    constraint users_youtube_url check (youtube = '' or (char_length(youtube) <= 300 and youtube ~* '^https?://[^\s"''<>]+$')),
    constraint users_web_url     check (web     = '' or (char_length(web) <= 300 and web ~* '^https?://[^\s"''<>]+$'))
);
create unique index if not exists users_username_uq on public.users (lower(username));
create index if not exists users_created_idx on public.users (created_at desc);

-- ---------- addons (Add-Ons, Modelos, Menús/Sprites y Servidores) ----------
create table if not exists public.addons (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid not null references public.users (id) on delete cascade,
    tipo             text not null default 'addon' references public.tipos_publicacion (id),

    nombre           text not null,
    descripcion      text not null default '',
    etiquetas        text not null default '',

    -- imágenes (URL pública de Storage)
    portada          text not null,
    banner           text,
    referencias      text not null default '[]',   -- JSON: lista de URLs de la galería
    videos           text not null default '[]',   -- JSON: lista de URLs de video
    youtube_id       text not null default '',

    -- Add-On / Modelo / Sprites
    version          text not null default '',
    plataforma       text not null default '',
    botones_descarga text not null default '[]',   -- JSON: [{url, nombre}]

    -- precio y contacto de ventas
    precio_activo    boolean not null default false,
    precio_monto     numeric(12,2) not null default 0,
    precio_moneda    text references public.monedas (codigo),
    contacto_whatsapp text not null default '',
    contacto_discord  text not null default '',

    -- Servidor
    multiplataforma  boolean not null default false,
    ip               text not null default '',
    puerto           text not null default '',
    puerto_java      text not null default '',
    puerto_bedrock   text not null default '',
    realm_enlace     text not null default '',
    web_url          text not null default '',
    discord_url      text not null default '',
    redes            text not null default '{}',   -- JSON: {youtube, tiktok, ...}

    -- contadores (solo los modifica la base de datos, nunca el navegador)
    descargas        integer not null default 0,
    likes            integer not null default 0,

    fecha            timestamptz not null default now(),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz,

    constraint addons_nombre_len   check (char_length(btrim(nombre)) between 1 and 80),
    constraint addons_desc_len     check (char_length(descripcion) <= 10000),
    constraint addons_etiq_len     check (char_length(etiquetas) <= 300),
    constraint addons_plataforma   check (plataforma in ('', 'java', 'bedrock', 'realms')),
    constraint addons_precio_ok    check (precio_monto >= 0 and (not precio_activo or (precio_monto > 0 and precio_moneda is not null))),
    constraint addons_contadores   check (descargas >= 0 and likes >= 0),
    constraint addons_json_len     check (char_length(referencias) <= 8000 and char_length(videos) <= 4000
                                          and char_length(botones_descarga) <= 4000 and char_length(redes) <= 4000),
    constraint addons_portada_url  check ((char_length(portada) <= 500 and portada ~ '^https://[^\s"''<>]+$')),
    constraint addons_banner_url   check (banner is null or (char_length(banner) <= 500 and banner ~ '^https://[^\s"''<>]+$')),
    constraint addons_web_url      check (web_url     = '' or (char_length(web_url) <= 300 and web_url ~* '^https?://[^\s"''<>]+$')),
    constraint addons_discord_url  check (discord_url = '' or (char_length(discord_url) <= 300 and discord_url ~* '^https?://[^\s"''<>]+$')),
    constraint addons_realm_url    check (realm_enlace = '' or (char_length(realm_enlace) <= 300 and realm_enlace ~* '^https?://[^\s"''<>]+$')),
    constraint addons_whatsapp     check (contacto_whatsapp ~ '^[0-9]{0,15}$')
);
create index if not exists addons_user_idx    on public.addons (user_id, created_at desc);
create index if not exists addons_created_idx on public.addons (created_at desc);
create index if not exists addons_tipo_idx    on public.addons (tipo);

-- ---------- likes ----------
create table if not exists public.likes (
    user_id    uuid not null references public.users (id)  on delete cascade,
    addon_id   uuid not null references public.addons (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, addon_id)
);
create index if not exists likes_addon_idx on public.likes (addon_id);

-- ---------- favorites ----------
create table if not exists public.favorites (
    user_id    uuid not null references public.users (id)  on delete cascade,
    addon_id   uuid not null references public.addons (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, addon_id)
);
create index if not exists favorites_addon_idx on public.favorites (addon_id);

-- ---------- descargas_log (anti-abuso: 1 descarga cada 10 min por usuario y addon) ----------
create table if not exists public.descargas_log (
    user_id  uuid not null references public.users (id)  on delete cascade,
    addon_id uuid not null references public.addons (id) on delete cascade,
    ultima   timestamptz not null default now(),
    primary key (user_id, addon_id)
);


-- =====================================================================
-- 3) FUNCIONES Y TRIGGERS
-- =====================================================================

-- ---------- Perfil automático al registrarse ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_username text;
    v_nombre   text;
begin
    v_username := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))));
    v_nombre   := left(btrim(coalesce(nullif(new.raw_user_meta_data ->> 'nombre_visible', ''), v_username)), 40);

    insert into public.users (id, username, nombre_visible)
    values (new.id, v_username, v_nombre);

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------- updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
    for each row execute function public.set_updated_at();

-- ---------- Protección de addons ----------
-- Desde el navegador (roles anon / authenticated) NO se pueden fijar likes,
-- descargas, fecha ni dueño. Eso solo lo hacen las funciones de abajo.
create or replace function public.addons_proteger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' then
        if current_user in ('anon', 'authenticated') then
            new.likes      := 0;
            new.descargas  := 0;
            new.fecha      := now();
            new.created_at := now();
        end if;
        new.updated_at := null;
    else
        if current_user in ('anon', 'authenticated') then
            new.id         := old.id;
            new.user_id    := old.user_id;
            new.likes      := old.likes;
            new.descargas  := old.descargas;
            new.fecha      := old.fecha;
            new.created_at := old.created_at;
        end if;
        new.updated_at := now();
    end if;
    return new;
end;
$$;

drop trigger if exists addons_proteger_trg on public.addons;
create trigger addons_proteger_trg
    before insert or update on public.addons
    for each row execute function public.addons_proteger();

-- ---------- Contador de likes (siempre exacto: se recuenta) ----------
create or replace function public.likes_actualizar_contador()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_addon uuid := coalesce(new.addon_id, old.addon_id);
begin
    update public.addons
       set likes = (select count(*)::int from public.likes where addon_id = v_addon)
     where id = v_addon;
    return null;
end;
$$;

drop trigger if exists likes_contador_trg on public.likes;
create trigger likes_contador_trg
    after insert or delete on public.likes
    for each row execute function public.likes_actualizar_contador();

-- ---------- Registrar descarga (suma exactamente 1) ----------
create or replace function public.registrar_descarga(p_addon_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_uid   uuid := auth.uid();
    v_total integer;
begin
    if v_uid is not null then
        -- usuario con sesión: máximo 1 descarga contada cada 10 minutos por addon
        insert into public.descargas_log (user_id, addon_id, ultima)
        values (v_uid, p_addon_id, now())
        on conflict (user_id, addon_id) do update
            set ultima = now()
            where public.descargas_log.ultima < now() - interval '10 minutes';

        if not found then
            select descargas into v_total from public.addons where id = p_addon_id;
            return v_total;
        end if;
    end if;

    update public.addons
       set descargas = descargas + 1
     where id = p_addon_id
    returning descargas into v_total;

    return v_total;
end;
$$;

-- Las funciones internas no deben poder llamarse desde la API
revoke all on function public.handle_new_user()             from public, anon, authenticated;
revoke all on function public.likes_actualizar_contador()   from public, anon, authenticated;
revoke all on function public.registrar_descarga(uuid)      from public;
grant  execute on function public.registrar_descarga(uuid)  to anon, authenticated;


-- =====================================================================
-- 4) SEGURIDAD: GRANTS + RLS
-- =====================================================================
grant usage on schema public to anon, authenticated;

alter table public.tipos_publicacion enable row level security;
alter table public.monedas           enable row level security;
alter table public.users             enable row level security;
alter table public.addons            enable row level security;
alter table public.likes             enable row level security;
alter table public.favorites         enable row level security;
alter table public.descargas_log     enable row level security;

-- Se parte de cero para que no queden permisos heredados de más
revoke all on public.tipos_publicacion, public.monedas, public.users, public.addons,
              public.likes, public.favorites, public.descargas_log
    from anon, authenticated;

-- Lectura pública
grant select on public.tipos_publicacion, public.monedas, public.users, public.addons to anon, authenticated;

-- users: cada quien edita solo su perfil y SOLO estas columnas (no username ni verificado)
grant update (nombre_visible, avatar, banner, bio, discord, whatsapp, tiktok, youtube, web)
    on public.users to authenticated;

-- addons: crear / editar / borrar las propias
grant insert, update, delete on public.addons to authenticated;

-- likes y favoritos: privados de cada usuario
grant select, insert, delete on public.likes, public.favorites to authenticated;

-- descargas_log: sin acceso directo (solo la función registrar_descarga)

-- ---------- Políticas ----------
drop policy if exists tipos_lectura on public.tipos_publicacion;
create policy tipos_lectura on public.tipos_publicacion for select to anon, authenticated using (true);

drop policy if exists monedas_lectura on public.monedas;
create policy monedas_lectura on public.monedas for select to anon, authenticated using (true);

drop policy if exists users_lectura on public.users;
create policy users_lectura on public.users for select to anon, authenticated using (true);

drop policy if exists users_editar_propio on public.users;
create policy users_editar_propio on public.users for update to authenticated
    using (id = (select auth.uid()))
    with check (id = (select auth.uid()));

drop policy if exists addons_lectura on public.addons;
create policy addons_lectura on public.addons for select to anon, authenticated using (true);

drop policy if exists addons_crear on public.addons;
create policy addons_crear on public.addons for insert to authenticated
    with check (user_id = (select auth.uid()));

drop policy if exists addons_editar_propio on public.addons;
create policy addons_editar_propio on public.addons for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

drop policy if exists addons_borrar_propio on public.addons;
create policy addons_borrar_propio on public.addons for delete to authenticated
    using (user_id = (select auth.uid()));

drop policy if exists likes_ver_propios on public.likes;
create policy likes_ver_propios on public.likes for select to authenticated
    using (user_id = (select auth.uid()));

drop policy if exists likes_crear on public.likes;
create policy likes_crear on public.likes for insert to authenticated
    with check (user_id = (select auth.uid()));

drop policy if exists likes_borrar on public.likes;
create policy likes_borrar on public.likes for delete to authenticated
    using (user_id = (select auth.uid()));

drop policy if exists favorites_ver_propios on public.favorites;
create policy favorites_ver_propios on public.favorites for select to authenticated
    using (user_id = (select auth.uid()));

drop policy if exists favorites_crear on public.favorites;
create policy favorites_crear on public.favorites for insert to authenticated
    with check (user_id = (select auth.uid()));

drop policy if exists favorites_borrar on public.favorites;
create policy favorites_borrar on public.favorites for delete to authenticated
    using (user_id = (select auth.uid()));

-- descargas_log: RLS activo y sin políticas = nadie accede desde la API


-- =====================================================================
-- 5) STORAGE: BUCKETS + POLÍTICAS
--    Ruta de cada archivo:  <bucket>/<user_id>/<uuid>.webp
--    Lectura pública por URL. Escribir / reemplazar / borrar: solo el dueño
--    de la carpeta. Los archivos viejos los borra la app al reemplazar o
--    quitar una imagen (Storage no permite borrar archivos con SQL).
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
    ('avatars',        'avatars',        true, 2097152, array['image/webp', 'image/jpeg', 'image/png']),  -- foto de perfil
    ('perfil-banners', 'perfil-banners', true, 3145728, array['image/webp', 'image/jpeg', 'image/png']),  -- banner de perfil
    ('portadas',       'portadas',       true, 3145728, array['image/webp', 'image/jpeg', 'image/png']),  -- portada 1:1 de publicaciones
    ('banners',        'banners',        true, 3145728, array['image/webp', 'image/jpeg', 'image/png']),  -- banner 3:1 de publicaciones
    ('galeria',        'galeria',        true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])   -- imágenes adicionales
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists fg_storage_ver_propios on storage.objects;
create policy fg_storage_ver_propios on storage.objects for select to authenticated
    using (
        bucket_id in ('avatars', 'perfil-banners', 'portadas', 'banners', 'galeria')
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists fg_storage_subir on storage.objects;
create policy fg_storage_subir on storage.objects for insert to authenticated
    with check (
        bucket_id in ('avatars', 'perfil-banners', 'portadas', 'banners', 'galeria')
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists fg_storage_reemplazar on storage.objects;
create policy fg_storage_reemplazar on storage.objects for update to authenticated
    using (
        bucket_id in ('avatars', 'perfil-banners', 'portadas', 'banners', 'galeria')
        and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
        bucket_id in ('avatars', 'perfil-banners', 'portadas', 'banners', 'galeria')
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists fg_storage_borrar on storage.objects;
create policy fg_storage_borrar on storage.objects for delete to authenticated
    using (
        bucket_id in ('avatars', 'perfil-banners', 'portadas', 'banners', 'galeria')
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );


-- =====================================================================
-- 6) COMPROBACIÓN (debe mostrar 7 tablas con rls = true y 5 buckets)
-- =====================================================================
select tablename, rowsecurity as rls
  from pg_tables
 where schemaname = 'public'
   and tablename in ('tipos_publicacion','monedas','users','addons','likes','favorites','descargas_log')
 order by tablename;

select id as bucket, public, file_size_limit from storage.buckets
 where id in ('avatars','perfil-banners','portadas','banners','galeria') order by id;
