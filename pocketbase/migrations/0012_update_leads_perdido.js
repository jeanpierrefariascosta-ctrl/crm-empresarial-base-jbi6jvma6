migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    const field = col.fields.getByName('etapa_kanban')

    if (field) {
      let values = Array.from(field.values)
      if (!values.includes('perdido')) {
        values.push('perdido')
        field.values = values
        app.save(col)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    const field = col.fields.getByName('etapa_kanban')

    if (field) {
      let values = Array.from(field.values)
      field.values = values.filter((v) => v !== 'perdido')
      app.save(col)
    }
  },
)
