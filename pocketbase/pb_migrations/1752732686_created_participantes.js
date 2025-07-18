/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
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
        "collectionId": "pbc_4040350901",
        "hidden": false,
        "id": "relation4126707129",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "persona_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1892724624",
        "hidden": false,
        "id": "relation1345710554",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "puesto_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
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
      }
    ],
    "id": "pbc_40403509012",
    "indexes": [],
    "listRule": null,
    "name": "participantes",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_40403509012");

  return app.delete(collection);
})
