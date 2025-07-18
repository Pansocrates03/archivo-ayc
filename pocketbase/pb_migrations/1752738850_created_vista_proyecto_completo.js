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
        "id": "_clone_5e7D",
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
        "id": "_clone_9glc",
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
        "id": "_clone_pRBY",
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
        "id": "_clone_4SUf",
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
        "id": "_clone_Q0HD",
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
        "id": "_clone_Nmu1",
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
    "id": "pbc_4043693475",
    "indexes": [],
    "listRule": null,
    "name": "vista_proyecto_completo",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT\n  (ROW_NUMBER() OVER ()) AS id,\n    p.id AS proyecto_id,\n    p.nombre AS proyecto_nombre,\n    p.anio,\n    p.sinopsis,\n    g.id AS grupo_id,\n    g.tag AS grupo_tag,\n    g.presentadopor,\n    g.nombre AS grupo_nombre\nFROM proyectos p\nJOIN grupos g ON p.grupo_id = g.id;",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4043693475");

  return app.delete(collection);
})
