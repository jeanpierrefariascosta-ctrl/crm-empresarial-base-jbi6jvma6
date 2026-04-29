routerAdd('POST', '/backend/v1/auth/register', (e) => {
  const body = e.requestInfo().body
  const { cnpj, razao_social, email, password, nome_completo, funcao } = body

  if (!cnpj || !razao_social || !email || !password || !nome_completo) {
    return e.badRequestError('Campos obrigatórios faltando')
  }

  return $app.runInTransaction((txApp) => {
    try {
      txApp.findAuthRecordByEmail('_pb_users_auth_', email)
      return e.badRequestError('E-mail já está em uso')
    } catch (_) {}

    let empresa
    try {
      empresa = txApp.findFirstRecordByData('empresas', 'cnpj', cnpj)
    } catch (_) {
      const empresasCol = txApp.findCollectionByNameOrId('empresas')
      empresa = new Record(empresasCol)
      empresa.set('cnpj', cnpj)
      empresa.set('razao_social', razao_social)
      empresa.set('ativo', true)
      txApp.save(empresa)
    }

    const usersCol = txApp.findCollectionByNameOrId('_pb_users_auth_')
    const user = new Record(usersCol)
    user.setEmail(email)
    user.setPassword(password)
    user.set('nome_completo', nome_completo)
    user.set('funcao', funcao || 'admin')
    user.set('empresa_id', empresa.id)
    user.set('ativo', true)
    txApp.save(user)

    return e.json(200, { success: true })
  })
})
