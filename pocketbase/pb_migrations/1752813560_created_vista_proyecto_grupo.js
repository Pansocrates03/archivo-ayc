/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
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
        "id": "_clone_j8ei",
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
        "id": "_clone_mVtS",
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
        "id": "_clone_uvwY",
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
        "id": "_clone_vzU3",
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
        "id": "_clone_YCLW",
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
        "id": "_clone_qOqL",
        "max": 0,
        "min": 0,
        "name": "grupo_nombre",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_3088080376",
    "indexes": [],
    "listRule": "",
    "name": "vista_proyecto_grupo",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT\n    (ROW_NUMBER() OVER ()) AS id,\n    p.id AS proyecto_id,\n    p.nombre AS proyecto_nombre,\n    p.anio,\n    p.sinopsis,\n\n    g.id AS grupo_id,\n    g.tag AS grupo_tag,\n    g.presentadopor,\n    g.nombre AS grupo_nombre\n\nFROM proyectos p\nJOIN grupos g ON p.grupo_id = g.id",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3088080376");

  return app.delete(collection);
})
