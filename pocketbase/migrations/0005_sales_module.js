migrate(
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    const empresas = app.findCollectionByNameOrId('empresas')

    leads.fields.add(new DateField({ name: 'data_fechamento_previsto' }))
    leads.fields.add(new NumberField({ name: 'valor_confirmado' }))
    leads.fields.add(new TextField({ name: 'proximo_passo' }))
    leads.fields.add(new TextField({ name: 'objecoes' }))
    leads.fields.add(new TextField({ name: 'estrategia' }))

    const etapa = leads.fields.getByName('etapa_kanban')
    etapa.values = ['prospecção', 'qualificação', 'proposta', 'negociação', 'fechamento', 'fechado']

    app.save(leads)

    const reunioes = new Collection({
      name: 'reunioes',
      type: 'base',
      listRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      viewRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      createRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      updateRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      deleteRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresas.id,
          maxSelect: 1,
        },
        { name: 'lead_id', type: 'relation', required: true, collectionId: leads.id, maxSelect: 1 },
        { name: 'titulo', type: 'text', required: true },
        { name: 'data_hora', type: 'date', required: true },
        { name: 'meet_link', type: 'url' },
        { name: 'resumo_ia', type: 'text' },
        { name: 'audio_file', type: 'file', maxSelect: 1, maxSize: 52428800 },
        { name: 'participantes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(reunioes)

    const propostas = new Collection({
      name: 'propostas',
      type: 'base',
      listRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      viewRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      createRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      updateRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      deleteRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresas.id,
          maxSelect: 1,
        },
        { name: 'lead_id', type: 'relation', required: true, collectionId: leads.id, maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['enviada', 'visualizada', 'assinada', 'rejeitada'],
        },
        { name: 'valor', type: 'number' },
        { name: 'arquivo', type: 'file', maxSelect: 1, maxSize: 5242880 },
        { name: 'conteudo', type: 'json' },
        { name: 'visualizacoes', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(propostas)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const interacoes = new Collection({
      name: 'interacoes',
      type: 'base',
      listRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      viewRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      createRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      updateRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      deleteRule: "@request.auth.id != '' && empresa_id = @request.auth.empresa_id",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresas.id,
          maxSelect: 1,
        },
        { name: 'lead_id', type: 'relation', required: true, collectionId: leads.id, maxSelect: 1 },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['nota', 'email', 'ligacao', 'reuniao', 'sistema'],
        },
        { name: 'conteudo', type: 'text', required: true },
        {
          name: 'autor_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(interacoes)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('interacoes'))
    app.delete(app.findCollectionByNameOrId('propostas'))
    app.delete(app.findCollectionByNameOrId('reunioes'))
    const leads = app.findCollectionByNameOrId('leads')
    leads.fields.removeByName('data_fechamento_previsto')
    leads.fields.removeByName('valor_confirmado')
    leads.fields.removeByName('proximo_passo')
    leads.fields.removeByName('objecoes')
    leads.fields.removeByName('estrategia')
    const etapa = leads.fields.getByName('etapa_kanban')
    etapa.values = ['prospecção', 'qualificação', 'proposta', 'negociação', 'fechamento']
    app.save(leads)
  },
)
