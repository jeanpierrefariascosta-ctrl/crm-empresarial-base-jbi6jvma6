migrate(
  (app) => {
    // Seed Empresa
    let empresaId
    try {
      const existing = app.findFirstRecordByData('empresas', 'cnpj', '00.000.000/0001-00')
      empresaId = existing.id
    } catch (_) {
      const empresasCol = app.findCollectionByNameOrId('empresas')
      const empresa = new Record(empresasCol)
      empresa.set('cnpj', '00.000.000/0001-00')
      empresa.set('razao_social', 'Acme Corporation')
      empresa.set('ativo', true)
      app.save(empresa)
      empresaId = empresa.id
    }

    // Seed Admin User
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'jpierre_costa@hotmail.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('jpierre_costa@hotmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      record.set('nome_completo', 'João Pierre Costa')
      record.set('funcao', 'diretor')
      record.set('empresa_id', empresaId)
      record.set('ativo', true)
      app.save(record)
    }

    // Seed Cliente
    let clienteId
    try {
      const existing = app.findFirstRecordByData('clientes', 'cnpj_cpf', '11.111.111/0001-11')
      clienteId = existing.id
    } catch (_) {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      const cliente = new Record(clientesCol)
      cliente.set('empresa_id', empresaId)
      cliente.set('razao_social', 'Globex Inc')
      cliente.set('cnpj_cpf', '11.111.111/0001-11')
      cliente.set('email', 'contato@globex.com')
      app.save(cliente)
      clienteId = cliente.id
    }

    // Seed Leads
    try {
      app.findFirstRecordByData('leads', 'valor_previsto', 50000)
    } catch (_) {
      const leadsCol = app.findCollectionByNameOrId('leads')
      const lead1 = new Record(leadsCol)
      lead1.set('empresa_id', empresaId)
      lead1.set('cliente_id', clienteId)
      lead1.set('etapa_kanban', 'prospecção')
      lead1.set('valor_previsto', 50000)
      lead1.set('probabilidade_fechamento', 20)
      app.save(lead1)

      const lead2 = new Record(leadsCol)
      lead2.set('empresa_id', empresaId)
      lead2.set('cliente_id', clienteId)
      lead2.set('etapa_kanban', 'negociação')
      lead2.set('valor_previsto', 120000)
      lead2.set('probabilidade_fechamento', 80)
      app.save(lead2)
    }

    // Seed Tarefas
    try {
      app.findFirstRecordByData('tarefas', 'titulo', 'Apresentação Comercial Globex')
    } catch (_) {
      const tarefasCol = app.findCollectionByNameOrId('tarefas')
      const t = new Record(tarefasCol)
      t.set('empresa_id', empresaId)
      t.set('titulo', 'Apresentação Comercial Globex')
      t.set('status', 'em_progresso')
      t.set('prioridade', 'alta')
      t.set('cliente_id', clienteId)
      app.save(t)
    }
  },
  (app) => {
    // Ignore down for seed
  },
)
