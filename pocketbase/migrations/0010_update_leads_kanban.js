migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    const field = col.fields.getByName('etapa_kanban')
    if (field) {
      field.required = false
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    const field = col.fields.getByName('etapa_kanban')
    if (field) {
      field.required = true
      app.save(col)
    }
  },
)
