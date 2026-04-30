migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')

    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({ name: 'status', maxSelect: 1, values: ['ativo', 'inativo'] }),
      )
    }
    if (!col.fields.getByName('socios')) {
      col.fields.add(new JSONField({ name: 'socios' }))
    }

    col.addIndex('idx_clientes_cidade', false, 'cidade', '')
    col.addIndex('idx_clientes_uf', false, 'uf', '')
    col.addIndex('idx_clientes_status', false, 'status', '')

    app.save(col)

    // Set default status to existing clients
    try {
      app
        .db()
        .newQuery("UPDATE clientes SET status = 'ativo' WHERE status = '' OR status IS NULL")
        .execute()
    } catch (e) {
      console.log('Failed to update default status', e)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')

    col.removeIndex('idx_clientes_cidade')
    col.removeIndex('idx_clientes_uf')
    col.removeIndex('idx_clientes_status')

    col.fields.removeByName('status')
    col.fields.removeByName('socios')

    app.save(col)
  },
)
