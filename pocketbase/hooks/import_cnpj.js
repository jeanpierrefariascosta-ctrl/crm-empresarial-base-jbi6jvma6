routerAdd(
  'POST',
  '/backend/v1/import/cnpj',
  (e) => {
    const body = e.requestInfo().body
    const { cnpj } = body
    if (!cnpj) return e.badRequestError('CNPJ é obrigatório')

    const cleanCnpj = cnpj.replace(/\D/g, '')

    const res = $http.send({
      url: `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      method: 'GET',
      timeout: 15,
    })

    if (res.statusCode !== 200) {
      return e.badRequestError('CNPJ não encontrado na Receita Federal')
    }

    const data = res.json

    return $app.runInTransaction((txApp) => {
      const authRecord = e.auth
      const empresaId = authRecord.getString('empresa_id')

      const clientesCol = txApp.findCollectionByNameOrId('clientes')
      const cliente = new Record(clientesCol)
      cliente.set('empresa_id', empresaId)
      cliente.set('razao_social', data.razao_social)
      cliente.set('cnpj_cpf', data.cnpj)
      cliente.set('email', data.email || '')
      cliente.set('telefone', data.ddd_telefone_1 || '')
      cliente.set('criado_por', authRecord.id)
      txApp.save(cliente)

      const leadsCol = txApp.findCollectionByNameOrId('leads')
      const lead = new Record(leadsCol)
      lead.set('empresa_id', empresaId)
      lead.set('cliente_id', cliente.id)
      lead.set('etapa_kanban', 'prospecção')
      lead.set('responsavel_id', authRecord.id)
      lead.set('fonte_lead', 'Receita Federal')
      txApp.save(lead)

      if (data.qsa && Array.isArray(data.qsa)) {
        const contatosCol = txApp.findCollectionByNameOrId('contatos')
        for (const socio of data.qsa) {
          const contato = new Record(contatosCol)
          contato.set('empresa_id', empresaId)
          contato.set('cliente_id', cliente.id)
          contato.set('lead_id', lead.id)
          contato.set('nome', socio.nome_socio)
          contato.set('cargo', socio.qualificacao_socio)
          txApp.save(contato)
        }
      }

      return e.json(200, { success: true, lead_id: lead.id })
    })
  },
  $apis.requireAuth(),
)
