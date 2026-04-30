routerAdd(
  'POST',
  '/backend/v1/projetos/arquivos/{id}/resumo',
  (e) => {
    const id = e.request.pathValue('id')
    try {
      const arquivo = $app.findRecordById('arquivos_projeto', id)
      const fakeSummary =
        'Resumo gerado por IA: O documento aborda os escopos principais do projeto, destacando prazos, recursos alocados e as entregas esperadas nas três primeiras fases. Não foram identificados riscos críticos explícitos no texto.'

      arquivo.set('resumo_ia', fakeSummary)
      $app.save(arquivo)

      return e.json(200, { success: true, resumo: fakeSummary })
    } catch (err) {
      return e.notFoundError('Arquivo não encontrado.')
    }
  },
  $apis.requireAuth(),
)
