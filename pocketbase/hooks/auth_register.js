routerAdd('POST', '/backend/v1/auth/register', (e) => {
  const body = e.requestInfo().body

  if (!body.cnpj || !body.razao_social || !body.nome_completo || !body.email || !body.password) {
    throw new BadRequestError('Dados incompletos')
  }

  const cleanCnpj = body.cnpj.replace(/\D/g, '')

  let caughtError = null

  try {
    $app.runInTransaction((txApp) => {
      // Check for duplicate CNPJ
      try {
        txApp.findFirstRecordByData('empresas', 'cnpj', cleanCnpj)
        throw new Error('CNPJ_EXISTS')
      } catch (err) {
        if (err.message === 'CNPJ_EXISTS') throw err
      }

      // Check for duplicate Email
      try {
        txApp.findAuthRecordByEmail('users', body.email)
        throw new Error('EMAIL_EXISTS')
      } catch (err) {
        if (err.message === 'EMAIL_EXISTS') throw err
      }

      const empresas = txApp.findCollectionByNameOrId('empresas')
      const empresa = new Record(empresas)
      empresa.set('cnpj', cleanCnpj)
      empresa.set('razao_social', body.razao_social)
      empresa.set('ativo', true)
      txApp.save(empresa)

      const users = txApp.findCollectionByNameOrId('users')
      const user = new Record(users)
      user.setEmail(body.email)
      user.setPassword(body.password)
      user.set('name', body.nome_completo)
      user.set('nome_completo', body.nome_completo)
      user.set('funcao', 'diretor') // Grant high-level master account access
      user.set('empresa_id', empresa.id)
      user.set('ativo', true)
      txApp.save(user)
    })
  } catch (err) {
    caughtError = err
  }

  // Handle custom validation errors bubbled up from the transaction
  if (caughtError) {
    if (caughtError.message === 'CNPJ_EXISTS') {
      throw new BadRequestError('CNPJ já cadastrado', {
        cnpj: new ValidationError('not_unique', 'CNPJ já cadastrado'),
      })
    } else if (caughtError.message === 'EMAIL_EXISTS') {
      throw new BadRequestError('E-mail já cadastrado', {
        email: new ValidationError('not_unique', 'E-mail já cadastrado'),
      })
    } else {
      throw new InternalServerError(caughtError.message)
    }
  }

  return e.json(200, { message: 'Conta criada com sucesso' })
})
