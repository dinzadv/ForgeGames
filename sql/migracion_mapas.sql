insert into public.tipos_publicacion (id, cat_id, nombre, plural, descripcion, orden) values
('mapa', 'mapas', 'Mapa', 'Mapas', 'Mundos, aventuras y construcciones listos para jugar.', 4),
('servidor', 'servidores', 'Servidor', 'Servidores', 'Servidores de Java, Bedrock y Realms para jugar con otros.', 5)
on conflict (id) do update set
    cat_id = excluded.cat_id, nombre = excluded.nombre, plural = excluded.plural,
    descripcion = excluded.descripcion, orden = excluded.orden;
