/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4043693475")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n    (ROW_NUMBER() OVER ()) AS id,\n    p.id AS proyecto_id,\n    p.nombre AS proyecto_nombre,\n    p.anio,\n    p.sinopsis,\n\n    g.id AS grupo_id,\n    g.tag AS grupo_tag,\n    g.presentadopor,\n    g.nombre AS grupo_nombre,\n\n    pa.id AS participante_id,\n    per.nombre AS participante_nombre,\n    pa.puesto,\n    pa.equipo,\n\n    a.id AS archivo_id,\n    a.nombre AS archivo_nombre,\n    a.url AS archivo_url\n\nFROM proyectos p\nJOIN grupos g ON p.grupo_id = g.id\nLEFT JOIN participantes pa ON pa.proyecto_id = p.id\nLEFT JOIN personas per ON pa.persona_id = per.id\nLEFT JOIN archivos a ON a.proyecto_id = p.id;"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_RuuQ")

  // remove field
  collection.fields.removeById("_clone_Ii0c")

  // remove field
  collection.fields.removeById("_clone_zSua")

  // remove field
  collection.fields.removeById("_clone_btjk")

  // remove field
  collection.fields.removeById("_clone_DqnE")

  // remove field
  collection.fields.removeById("_clone_80tH")

  // add field
  collection.fields.addAt(2, new Field({
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
  }))

  // add field
  collection.fields.addAt(3, new Field({
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
  }))

  // add field
  collection.fields.addAt(4, new Field({
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
  }))

  // add field
  collection.fields.addAt(6, new Field({
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
  }))

  // add field
  collection.fields.addAt(7, new Field({
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
  }))

  // add field
  collection.fields.addAt(8, new Field({
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
  }))

  // add field
  collection.fields.addAt(9, new Field({
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
  }))

  // add field
  collection.fields.addAt(10, new Field({
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
  }))

  // add field
  collection.fields.addAt(11, new Field({
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
  }))

  // add field
  collection.fields.addAt(12, new Field({
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
  }))

  // add field
  collection.fields.addAt(13, new Field({
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
  }))

  // add field
  collection.fields.addAt(14, new Field({
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
  }))

  // add field
  collection.fields.addAt(15, new Field({
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
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4043693475")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n  (ROW_NUMBER() OVER ()) AS id,\n    p.id AS proyecto_id,\n    p.nombre AS proyecto_nombre,\n    p.anio,\n    p.sinopsis,\n    g.id AS grupo_id,\n    g.tag AS grupo_tag,\n    g.presentadopor,\n    g.nombre AS grupo_nombre\nFROM proyectos p\nJOIN grupos g ON p.grupo_id = g.id;"
  }, collection)

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_RuuQ",
    "max": 0,
    "min": 0,
    "name": "proyecto_nombre",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "_clone_Ii0c",
    "max": null,
    "min": null,
    "name": "anio",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_zSua",
    "max": 0,
    "min": 0,
    "name": "sinopsis",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_btjk",
    "max": 0,
    "min": 0,
    "name": "grupo_tag",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "_clone_DqnE",
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
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_80tH",
    "max": 0,
    "min": 0,
    "name": "grupo_nombre",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("_clone_VYhL")

  // remove field
  collection.fields.removeById("_clone_rLsV")

  // remove field
  collection.fields.removeById("_clone_ZkdO")

  // remove field
  collection.fields.removeById("_clone_x1je")

  // remove field
  collection.fields.removeById("_clone_Jil3")

  // remove field
  collection.fields.removeById("_clone_YqVj")

  // remove field
  collection.fields.removeById("relation4143251862")

  // remove field
  collection.fields.removeById("_clone_XuHI")

  // remove field
  collection.fields.removeById("_clone_oIgb")

  // remove field
  collection.fields.removeById("_clone_go0p")

  // remove field
  collection.fields.removeById("relation1189869883")

  // remove field
  collection.fields.removeById("_clone_CdOP")

  // remove field
  collection.fields.removeById("_clone_evHW")

  return app.save(collection)
})
