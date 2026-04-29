routerAdd('POST', '/backend/v1/campaigns/{id}/capture', (e) => {
  const campaignId = e.request.pathValue('id')
  const body = e.requestInfo().body
  const { nome, email, telefone, razao_social, cnpj } = body

  if (!nome || !email || !razao_social) {
    return e.badRequestError('Nome, email e razão social são obrigatórios')
  }

  return $app.runInTransaction((txApp) => {
    let campaign
    try {
      campaign = txApp.findRecordById('campanhas_ads', campaignId)
    } catch (_) {
      return e.notFoundError('Campanha não encontrada')
    }

    const empresaId = campaign.getString('empresa_id')
    const defaultRespId = campaign.getString('responsavel_default_id')

    let cliente
    try {
      cliente = txApp.findFirstRecordByData('clientes', 'email', email)
    } catch (_) {
      const clientesCol = txApp.findCollectionByNameOrId('clientes')
      cliente = new Record(clientesCol)
      cliente.set('empresa_id', empresaId)
      cliente.set('razao_social', razao_social)
      cliente.set('cnpj_cpf', cnpj || '')
      cliente.set('email', email)
      cliente.set('telefone', telefone || '')
      txApp.save(cliente)
    }

    const leadsCol = txApp.findCollectionByNameOrId('leads')
    const lead = new Record(leadsCol)
    lead.set('empresa_id', empresaId)
    lead.set('cliente_id', cliente.id)
    lead.set('etapa_kanban', 'prospecção')
    lead.set('campanha_id', campaign.id)
    lead.set('fonte_lead', campaign.getString('nome_campanha'))
    if (defaultRespId) {
      lead.set('responsavel_id', defaultRespId)
    }
    txApp.save(lead)

    const contatosCol = txApp.findCollectionByNameOrId('contatos')
    const contato = new Record(contatosCol)
    contato.set('empresa_id', empresaId)
    contato.set('cliente_id', cliente.id)
    contato.set('lead_id', lead.id)
    contato.set('nome', nome)
    contato.set('email', email)
    contato.set('telefone', telefone || '')
    txApp.save(contato)

    return e.json(200, { success: true })
  })
})
