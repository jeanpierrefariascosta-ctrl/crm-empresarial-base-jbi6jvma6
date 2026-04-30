routerAdd(
  'POST',
  '/backend/v1/import/cnpj',
  (e) => {
    const body = e.requestInfo().body
    const { cnpj } = body
    if (!cnpj) return e.badRequestError('CNPJ é obrigatório')

    const cleanCnpj = cnpj.replace(/\D/g, '')

    const logConsulta = (sucesso) => {
      try {
        const logsCol = $app.findCollectionByNameOrId('logs_consulta_cnpj')
        const log = new Record(logsCol)
        log.set('cnpj', cleanCnpj)
        log.set('usuario_id', e.auth.id)
        log.set('sucesso', sucesso)
        $app.save(log)
      } catch (err) {
        console.log('Erro ao salvar log:', err)
      }
    }

    const res = $http.send({
      url: `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      method: 'GET',
      timeout: 15,
    })

    if (res.statusCode !== 200) {
      logConsulta(false)
      return e.badRequestError('CNPJ não encontrado na Receita Federal')
    }

    logConsulta(true)
    const data = res.json

    return e.json(200, {
      razao_social: data.razao_social,
      cnpj: data.cnpj,
      email: data.email || '',
      telefone: data.ddd_telefone_1 || '',
      fantasia: data.nome_fantasia || '',
      cep: data.cep || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.municipio || '',
      uf: data.uf || '',
      qsa: data.qsa || [],
    })
  },
  $apis.requireAuth(),
)
