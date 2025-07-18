/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4043693475");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3455578297",
        "hidden": false,
        "id": "relation4129673658",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "proyecto_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_VYhL",
        "max": 0,
        "min": 0,
        "name": "proyecto_nombre",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "_clone_rLsV",
        "max": null,
        "min": null,
        "name": "anio",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_ZkdO",
        "max": 0,
        "min": 0,
        "name": "sinopsis",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_860569520",
        "hidden": false,
        "id": "relation2625843203",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "grupo_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_x1je",
        "max": 0,
        "min": 0,
        "name": "grupo_tag",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "_clone_Jil3",
        "maxSelect": 1,
        "name": "presentadopor",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Arte y Cultura",
          "Prepa Tec",
          "Grupo Estudiantil",
          "Sociedad Artística del Tecnológico"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_YqVj",
        "max": 0,
        "min": 0,
        "name": "grupo_nombre",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_40403509012",
        "hidden": false,
        "id": "relation4143251862",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "participante_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_XuHI",
        "max": 0,
        "min": 0,
        "name": "participante_nombre",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_oIgb",
        "max": 0,
        "min": 0,
        "name": "puesto",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "_clone_go0p",
        "maxSelect": 1,
        "name": "equipo",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "presentacion",
          "direccion",
          "produccion",
          "staff",
          "auditorio",
          "elenco"
        ]
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1489198250",
        "hidden": false,
        "id": "relation1189869883",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "archivo_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_CdOP",
        "max": 0,
        "min": 0,
        "name": "archivo_nombre",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_evHW",
        "max": 0,
        "min": 0,
        "name": "archivo_url",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_4043693475",
    "indexes": [],
    "listRule": "",
    "name": "vista_proyecto_completo",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT\n    (ROW_NUMBER() OVER ()) AS id,\n    p.id AS proyecto_id,\n    p.nombre AS proyecto_nombre,\n    p.anio,\n    p.sinopsis,\n\n    g.id AS grupo_id,\n    g.tag AS grupo_tag,\n    g.presentadopor,\n    g.nombre AS grupo_nombre,\n\n    pa.id AS participante_id,\n    per.nombre AS participante_nombre,\n    pa.puesto,\n    pa.equipo,\n\n    a.id AS archivo_id,\n    a.nombre AS archivo_nombre,\n    a.url AS archivo_url\n\nFROM proyectos p\nJOIN grupos g ON p.grupo_id = g.id\nLEFT JOIN participantes pa ON pa.proyecto_id = p.id\nLEFT JOIN personas per ON pa.persona_id = per.id\nLEFT JOIN archivos a ON a.proyecto_id = p.id;",
    "viewRule": ""
  });

  return app.save(collection);
})
