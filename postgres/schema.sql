CREATE DATABASE actec_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- Para eliminar acentos en búsquedas


-- ==========================================
-- 1. FUNCIONES UNIVERSALES (Mejor Práctica)
-- ==========================================
-- Esta función asegura que el campo updated_at se actualice automáticamente en cada UPDATE.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. CREACIÓN DE TABLAS
-- ==========================================

CREATE TABLE personas (
    id VARCHAR(15) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) UNIQUE, -- Asumiendo que las matrículas no se repiten
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    id VARCHAR(15) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) CHECK (categoria IN ('direccion', 'produccion', 'elenco', 'staff')),
    requerido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grupos (
    id VARCHAR(15) PRIMARY KEY,
    tag VARCHAR(50) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    sede VARCHAR(100) CHECK (sede IN ('mty', 'pt', 'sat', 'otro')),
    -- He añadido los campos que mencionaste en tu primer script para no perderlos
    descripcion TEXT,
    disciplina VARCHAR(100),
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proyectos (
    id VARCHAR(15) PRIMARY KEY,
    grupo_id VARCHAR(15) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    anio SMALLINT CHECK (anio > 1900 AND anio < 2100),
    estreno DATE,
    programa_url TEXT,
    thumbnail_url TEXT,
    galeria_urls JSONB DEFAULT '[]'::jsonb, -- Aquí sí es válido JSONB (son solo strings de URLs)
    youtube_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_proyecto_grupo FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE RESTRICT
);

-- Tabla puente centralizada: Reemplaza todos los arreglos JSON de PocketBase (elenco, musicos, etc.)
CREATE TABLE creditos (
    id VARCHAR(15) PRIMARY KEY,
    proyecto_id VARCHAR(15) NOT NULL,
    rol_id VARCHAR(15) NOT NULL,
    persona_id VARCHAR(15) NOT NULL,
    orden SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_credito_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    CONSTRAINT fk_credito_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_credito_persona FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
    -- Evitar que la misma persona tenga el mismo rol dos veces en la misma obra
    CONSTRAINT uq_proyecto_rol_persona UNIQUE (proyecto_id, rol_id, persona_id) 
);

-- ==========================================
-- 3. APLICACIÓN DE TRIGGERS
-- ==========================================

CREATE TRIGGER set_timestamp_personas
BEFORE UPDATE ON personas FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_roles
BEFORE UPDATE ON roles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_grupos
BEFORE UPDATE ON grupos FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_proyectos
BEFORE UPDATE ON proyectos FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_creditos
BEFORE UPDATE ON creditos FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ==========================================
-- 4. ÍNDICES DE RENDIMIENTO (Performance)
-- ==========================================
-- Los índices en las llaves foráneas son críticos para el rendimiento al hacer JOINs
CREATE INDEX idx_proyectos_grupo ON proyectos(grupo_id);
CREATE INDEX idx_creditos_proyecto ON creditos(proyecto_id);
CREATE INDEX idx_creditos_rol ON creditos(rol_id);
CREATE INDEX idx_creditos_persona ON creditos(persona_id);

-- Índices para búsquedas de texto frecuentes
CREATE INDEX idx_personas_nombre ON personas USING gin (unaccent(nombre) gin_trgm_ops); -- Útil si implementas pg_trgm
CREATE INDEX idx_proyectos_nombre ON proyectos(nombre);

-- Datos base para tabla companies

INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('id','name','descripcion','disciplina','banner_url');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('pt-tmus','Teatro Musical','Compañía de Teatro Musical PT','Teatro','https://pocketbase-production-4f9d.up.railway.app/api/files/pbc_3455578297/zve59henw1woaus/amores_completo_50_i7lvkpi15q_kecjp5b5hg.jpg');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('mty-ens','Concierto  Ensamble','Concierto Ensamble','Musica','https://scontent.fntr5-1.fna.fbcdn.net/v/t39.30808-6/521610482_10161704001973317_4703909770885626360_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=f798df&_nc_eui2=AeFMiP-0VSOKTbTLXkAobCZuMaqAr7qzRqMxqoCvurNGoxzEQEHmI0A87fYAoa4aLocWNK7rx4hS71NAundrnN0Z&_nc_ohc=-Ee6SH9jNJgQ7kNvwFUuoU5&_nc_oc=Adq691qenk15vn59VjbHsDMre12UJuDGupNb_ai4Ce2cUvwCGTcrFdyBEgt3ZE0YmdQclrQvmAk4FtJYbFHwz--w&_nc_zt=23&_nc_ht=scontent.fntr5-1.fna&_nc_gid=tVaBYTwE-Tq9uzeWOd7NBA&_nc_ss=7a3a8&oh=00_AfwKbBn-cTSHK7KT_GoN2Yk1k-vSDAGyg0HSPQgMhn493Q&oe=69CF6838');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('mty-cor','Coro','Coro del Tec','Música','https://scontent.fntr5-1.fna.fbcdn.net/v/t39.30808-6/508730061_1154222206744174_1381796885443053929_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=dd6889&_nc_eui2=AeHYo6i2JDsYPGEWXGrKOdGBqCKaY6SHQ-yoIppjpIdD7IvNGfGiGlLS798dXOnr7GjdLtD-XQu0OrAYNdqOOSVj&_nc_ohc=k9JR9OTyy_EQ7kNvwEFMAE2&_nc_oc=AdpN8IlgrWAO9HHdFsRwZO4zRSgyvVzAaedgru5uu9RqZMiygJJfLU3uBcDaow5_Xxt-q7zr6D8u7oU5l3o7XHOC&_nc_zt=23&_nc_ht=scontent.fntr5-1.fna&_nc_gid=ae8MMOsWsQs37aUdwaRa3w&_nc_ss=7a3a8&oh=00_Afzpc3v7BGZ4mx6_JFUIhFZxrQkuf1TOpEFs0vGkFEYMzA&oe=69CF7122');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('mty-tco','The Company','Compañía de Danza Contemporánea','Danza','https://scontent.fntr5-1.fna.fbcdn.net/v/t39.30808-6/499195067_1154266190073109_2058678145947527184_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=dd6889&_nc_eui2=AeHDJarV-jK_yiWxpoWs3vZVILmncIKPxqkguadwgo_GqflJWr9H-y2EdaD5o6tfecGSmBg9oRxmPIdvAshpT2tp&_nc_ohc=lPrhH1obMOoQ7kNvwHEyg-l&_nc_oc=AdqfP9Ig_iz0xDMzfEMYGcrm-tLmMPS-4DBTt8R2GcoC9TIidBjvWFI1g-hwa9GzCYJ5845zTWw-o8u6J-p5ENkQ&_nc_zt=23&_nc_ht=scontent.fntr5-1.fna&_nc_gid=WvUMogKjMULyKt1aY1-EKA&_nc_ss=7a3a8&oh=00_AfzwuR5jKtk1a7Pgtu86uYZCS_REvbgGYq6VCN0OPp-yTA&oe=69CF4D2C');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('sat','Sociedad Artística del Tecnológico','Sociedad Artística del Tecnológico','Arte','https://scontent.fntr5-1.fna.fbcdn.net/v/t39.30808-6/484070008_1072063194960076_1811421497493430147_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeEcQ7CzLVrovSaRjaywK7_zTsn-X0cZeQ1Oyf5fRxl5DVAaHzQINEoqBc53H4DDoIgbqwxsXqsUl2CRYhG0RKcJ&_nc_ohc=sQB1aKIcmXEQ7kNvwHSx-jG&_nc_oc=AdqE9RF_Z1w-gs8QERs4UKkYQsP0IKmkwX7REkO9coDF1foX-a7qbqboqITcCqiKCgjfJBLD4pEqs1ajqQ25ftE_&_nc_zt=23&_nc_ht=scontent.fntr5-1.fna&_nc_gid=nc-qIi7dlc4EsWo0hC2Dkw&_nc_ss=7a3a8&oh=00_AfzVl0bKFaZL770EDR473_djunHYlEB10L7uGs5_QaKWZA&oe=69CF7054');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('pt-dt','Prepa Tec Dance Team','Prepa Tec Dance Team','danza','https://pocketbase-production-4f9d.up.railway.app/api/files/pbc_3455578297/zve59henw1woaus/amores_completo_50_i7lvkpi15q_kecjp5b5hg.jpg');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('pt-ba','Banda Azul','Banda Azul PT','Música','https://pocketbase-production-4f9d.up.railway.app/api/files/pbc_3455578297/zve59henw1woaus/amores_completo_50_i7lvkpi15q_kecjp5b5hg.jpg');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('pt-am','Alegría Mexicana','Compañía Folklórica Alegría Mexica','Danza','https://pocketbase-production-4f9d.up.railway.app/api/files/pbc_3455578297/zve59henw1woaus/amores_completo_50_i7lvkpi15q_kecjp5b5hg.jpg');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('mty-tmus','Teatro Musical','Compañía de Teatro Musical','Teatro','https://scontent.fntr5-1.fna.fbcdn.net/v/t39.30808-6/488256803_1092446436255085_6743821086747028511_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=dd6889&_nc_eui2=AeHNYNW_rt6iDw4O8hWOan3aW6t25Um8aUhbq3blSbxpSNdt4qsnhxqwPEn-yyW8bqu-5OaHxmRfPw4E0RHnxaKI&_nc_ohc=6BMxul-NYUkQ7kNvwEVjdbU&_nc_oc=AdqIunaEr4K3PMQU1FvBAqucO_IwPK2pYcwQcDmVUNJDLTYUH2xqb57qwtGRqcwRECgSuicd5tZlE_iaqXO4XsCc&_nc_zt=23&_nc_ht=scontent.fntr5-1.fna&_nc_gid=4YWBCy6mlEJP2w-w51vzNQ&_nc_ss=7a3a8&oh=00_Afzh7qum7-NjylHUvVk9wXGC8SudGOlD2uR80Y_dxvDiSg&oe=69CF5BE6');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('mty-rai','Raíces','Compañía de danza folklórica','Danza','https://scontent.fntr5-1.fna.fbcdn.net/v/t39.30808-6/596800254_10162339864828317_3015569013084818673_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=f798df&_nc_eui2=AeFsMM-BZDRnraqBdbbOLiImaHlSc6MqztZoeVJzoyrO1viZ859Kj1xT3kgecSPVKGAFMepj1CGOP3R7ZTi6h89B&_nc_ohc=KTudbsh63p8Q7kNvwFWxDog&_nc_oc=AdoRCGxWA0qDF3IPJYHOvjijoGZ80xmmNufTPmBUrRuvXdU-zi1XNB7aHrXLvNj_86uxfetWQTFDzRPwRw0-ttBB&_nc_zt=23&_nc_ht=scontent.fntr5-1.fna&_nc_gid=ASHPdGr4sKJcj5h_DzhDPg&_nc_ss=7a3a8&oh=00_AfyxjdNqgKYJcBgwEkYjkykhK9afPcHC_dlMw9I2rjqXrw&oe=69CF6644');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('mty-tmae','Teatro de Maestros','Compañía de Teatro de Maestros','Teatro','https://scontent.fntr5-1.fna.fbcdn.net/v/t39.30808-6/476404163_1026380619524638_170808080518234127_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=dd6889&_nc_eui2=AeHBR5ZJyTK338kFvUwadhAXnDikqv1dxWmcOKSq_V3FaZ0rcE1TzPPE2PEeNIbd1VAAq92NhRY1HJm0TUsvEbm6&_nc_ohc=SW6FdCfMj7kQ7kNvwGi5twh&_nc_oc=AdoR1iu7IK9rw0wWfmfs36CWcDnxnTs2yj4cC9nWwx_tDi1Rhu8ogIJpNtyuJKEhAOMaLFB4dzYHmbD8zDcncd9t&_nc_zt=23&_nc_ht=scontent.fntr5-1.fna&_nc_gid=gQmFGgmTiNNZoAQ2pDgeyw&_nc_ss=7a3a8&oh=00_Afz4ixb8cWunqYVzij8o9x3vPoy0ekMexcGhjqHQcjMl6g&oe=69CF5D77');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('mty-tea','Teatro','Compañía de Teatro','Teatro','https://pocketbase-production-4f9d.up.railway.app/api/files/pbc_3455578297/zve59henw1woaus/amores_completo_50_i7lvkpi15q_kecjp5b5hg.jpg');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('mty-req','Requiem','Compañía de teatro en atril','Teatro','https://scontent.fntr5-1.fna.fbcdn.net/v/t39.30808-6/557789472_1248682377298156_300123130200070196_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=dd6889&_nc_eui2=AeE6WFDeCHdjGcLAQzwDLbFmg4rIh0Wo_5KDisiHRaj_khGxesVjmJzJsUzoFwXsZlZZjMjJL9hxPOW1GUP1p3iI&_nc_ohc=cjOeCvPG_OYQ7kNvwFLqwZQ&_nc_oc=AdpnwmBs-zGTF5s6EY4SG4gyuURT0RgjY8WzdoUeNEcehHDggbHrZuFhEkDmfC3zp-O4K7mQKwvq8sFJC7-r2RVA&_nc_zt=23&_nc_ht=scontent.fntr5-1.fna&_nc_gid=IiPS7sXgkgbJSNuTo5D89w&_nc_ss=7a3a8&oh=00_Afx2h3mrALZYOFERqAA2iCJQCmppyJKesTFclfqB7yYaZg&oe=69CF8156');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('mty-orq','Orquesta Sinfónica','Orquesta Sinfónica','Música','https://scontent.fntr5-1.fna.fbcdn.net/v/t39.30808-6/658521444_1389456749887384_6976110622858456881_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=dd6889&_nc_eui2=AeFEb0V1FvzrJ1s_j1NWYln7ZIlpIn8qUCZkiWkifypQJuHdX_FtpNDplFZZ2yY0B9Q2Nu2o6nBwYvilmRToEVLR&_nc_ohc=Pm-Qzx_YqzkQ7kNvwFUGKtN&_nc_oc=AdpzTQE3xnZQpuQ5Dgo_fiBef8FrnoeXYSclWvc0kyqubRBCDITnEyrfxCFtIzR38PEDUghlr-Bp97ZIofJkWs2c&_nc_zt=23&_nc_ht=scontent.fntr5-1.fna&_nc_gid=auyxi1o19KFw22b9cZ_cFA&_nc_ss=7a3a8&oh=00_Afw2jMnKWOetq8_t54H5cnKMlcxfTcBDNKVSH_t_HWOHsA&oe=69CF5C50');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('pt-tea','Teatro','Compañía de Teatro PT','Teatro','https://pocketbase-production-4f9d.up.railway.app/api/files/pbc_3455578297/zve59henw1woaus/amores_completo_50_i7lvkpi15q_kecjp5b5hg.jpg');
INSERT INTO companies(id,name,descripcion,disciplina,banner_url) VALUES ('pt-jam','Jam','JAM','Música','https://pocketbase-production-4f9d.up.railway.app/api/files/pbc_3455578297/zve59henw1woaus/amores_completo_50_i7lvkpi15q_kecjp5b5hg.jpg');

-- Datos ejemplo para tabla artists
