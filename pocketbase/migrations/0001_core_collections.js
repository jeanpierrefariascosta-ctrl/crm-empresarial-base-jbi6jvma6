migrate(
  (app) => {
    // 1. Empresas
    const empresas = new Collection({
      name: 'empresas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        { name: 'cnpj', type: 'text', required: true },
        { name: 'razao_social', type: 'text', required: true },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(empresas)

    // 2. Update Users
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(new TextField({ name: 'nome_completo' }))
    users.fields.add(
      new SelectField({
        name: 'funcao',
        values: ['analista', 'sdr', 'cdr', 'supervisor', 'head', 'diretor', 'admin'],
        maxSelect: 1,
      }),
    )
    users.fields.add(
      new SelectField({
        name: 'departamento',
        values: ['marketing', 'vendas', 'projetos'],
        maxSelect: 1,
      }),
    )
    users.fields.add(
      new RelationField({ name: 'empresa_id', collectionId: empresas.id, maxSelect: 1 }),
    )
    users.fields.add(new BoolField({ name: 'ativo' }))
    app.save(users)

    // 3. Clientes
    const clientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          collectionId: empresas.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'razao_social', type: 'text', required: true },
        { name: 'cnpj_cpf', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'criado_por', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(clientes)

    // 4. Campanhas Ads
    const campanhas = new Collection({
      name: 'campanhas_ads',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          collectionId: empresas.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'nome_campanha', type: 'text', required: true },
        {
          name: 'plataforma',
          type: 'select',
          values: ['google_ads', 'meta_ads', 'linkedin_ads', 'landing_page'],
          maxSelect: 1,
        },
        { name: 'orcamento', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(campanhas)

    // 5. Leads
    const leads = new Collection({
      name: 'leads',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          collectionId: empresas.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'cliente_id',
          type: 'relation',
          collectionId: clientes.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'etapa_kanban',
          type: 'select',
          values: ['prospecção', 'qualificação', 'proposta', 'negociação', 'fechamento'],
          required: true,
          maxSelect: 1,
        },
        { name: 'valor_previsto', type: 'number' },
        { name: 'probabilidade_fechamento', type: 'number' },
        { name: 'responsavel_id', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'campanha_id', type: 'relation', collectionId: campanhas.id, maxSelect: 1 },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(leads)

    // 6. Tarefas
    const tarefas = new Collection({
      name: 'tarefas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          collectionId: empresas.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['aberta', 'em_progresso', 'concluida', 'encerrada'],
          required: true,
          maxSelect: 1,
        },
        {
          name: 'prioridade',
          type: 'select',
          values: ['baixa', 'media', 'alta', 'critica'],
          maxSelect: 1,
        },
        { name: 'responsavel_id', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'cliente_id', type: 'relation', collectionId: clientes.id, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(tarefas)
  },
  (app) => {
    // Revert logic
    const collections = ['tarefas', 'leads', 'campanhas_ads', 'clientes', 'empresas']
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }

    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.fields.removeByName('nome_completo')
      users.fields.removeByName('funcao')
      users.fields.removeByName('departamento')
      users.fields.removeByName('empresa_id')
      users.fields.removeByName('ativo')
      app.save(users)
    } catch (_) {}
  },
)
