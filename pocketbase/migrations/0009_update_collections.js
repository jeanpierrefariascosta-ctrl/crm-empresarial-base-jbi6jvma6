migrate(
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    if (!clientes.fields.getByName('nome_fantasia')) {
      clientes.fields.add(new TextField({ name: 'nome_fantasia' }))
    }
    if (!clientes.fields.getByName('cnae')) {
      clientes.fields.add(new TextField({ name: 'cnae' }))
    }
    if (!clientes.fields.getByName('data_abertura')) {
      clientes.fields.add(new DateField({ name: 'data_abertura' }))
    }
    if (!clientes.fields.getByName('situacao')) {
      clientes.fields.add(new TextField({ name: 'situacao' }))
    }
    if (!clientes.fields.getByName('faturamento')) {
      clientes.fields.add(new NumberField({ name: 'faturamento' }))
    }
    app.save(clientes)

    const contatos = app.findCollectionByNameOrId('contatos')
    if (!contatos.fields.getByName('rede_social')) {
      contatos.fields.add(
        new SelectField({ name: 'rede_social', values: ['linkedin', 'instagram'], maxSelect: 1 }),
      )
    }
    if (!contatos.fields.getByName('bio')) {
      contatos.fields.add(new TextField({ name: 'bio' }))
    }
    if (!contatos.fields.getByName('foto_perfil')) {
      contatos.fields.add(new URLField({ name: 'foto_perfil' }))
    }
    if (!contatos.fields.getByName('origem_enriquecimento')) {
      contatos.fields.add(new BoolField({ name: 'origem_enriquecimento' }))
    }
    app.save(contatos)

    const leads = app.findCollectionByNameOrId('leads')
    leads.addIndex('idx_leads_fonte', false, 'fonte_lead', '')
    app.save(leads)
  },
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')
    clientes.fields.removeByName('nome_fantasia')
    clientes.fields.removeByName('cnae')
    clientes.fields.removeByName('data_abertura')
    clientes.fields.removeByName('situacao')
    clientes.fields.removeByName('faturamento')
    app.save(clientes)

    const contatos = app.findCollectionByNameOrId('contatos')
    contatos.fields.removeByName('rede_social')
    contatos.fields.removeByName('bio')
    contatos.fields.removeByName('foto_perfil')
    contatos.fields.removeByName('origem_enriquecimento')
    app.save(contatos)

    const leads = app.findCollectionByNameOrId('leads')
    leads.removeIndex('idx_leads_fonte')
    app.save(leads)
  },
)
