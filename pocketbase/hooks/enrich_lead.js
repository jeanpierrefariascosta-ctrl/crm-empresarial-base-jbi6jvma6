routerAdd(
  'POST',
  '/backend/v1/enrich/lead/{id}',
  (e) => {
    const leadId = e.request.pathValue('id')
    let lead
    try {
      lead = $app.findRecordById('leads', leadId)
    } catch (_) {
      return e.notFoundError('Lead não encontrado')
    }

    $app.expandRecord(lead, ['cliente_id'], null)
    const cliente = lead.expandedOne('cliente_id')
    if (!cliente) return e.badRequestError('Lead sem cliente vinculado')

    const razaoSocial = cliente.getString('razao_social')

    const apiKey = $secrets.get('SKIP_LLM_KEY')
    if (!apiKey) {
      return e.badRequestError('SKIP_LLM_KEY_MISSING')
    }

    const prompt = `Analise a empresa brasileira chamada "${razaoSocial}".
Retorne APENAS um objeto JSON com as chaves:
- "contatos": array de 3 objetos de executivos ou contatos-chave (ex: Gerente de Vendas, Diretor de Marketing, CEO) com as chaves: "nome" (string), "cargo" (string), "linkedin_url" (string simulada), "instagram_url" (string simulada), "rede_social" ("linkedin" ou "instagram"), "bio" (string curta), "foto_perfil" (use "https://img.usecurling.com/ppl/thumbnail?seed=" + um numero aleatorio de 1 a 1000).
- "estrategia": string com 2 a 3 frases com uma estratégia comercial para abordar essa empresa.
- "proximo_passo": string com uma ação clara e recomendada como próximo passo de vendas.`

    const res = $http.send({
      url: 'https://router.skip.dev/llm/v1/chat/completions',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
      timeout: 45,
    })

    if (res.statusCode !== 200) {
      return e.internalServerError('Falha na API de enriquecimento')
    }

    let contacts = []
    let estrategia = ''
    let proximo_passo = ''

    try {
      const content = JSON.parse(res.json.choices[0].message.content)
      contacts = Array.isArray(content.contatos) ? content.contatos : []
      estrategia = content.estrategia || ''
      proximo_passo = content.proximo_passo || ''
    } catch (err) {
      return e.internalServerError('Falha ao parsear dados gerados')
    }

    try {
      lead.set('estrategia', estrategia)
      lead.set('proximo_passo', proximo_passo)
      lead.set('enriquecido', true)
      $app.save(lead)
    } catch (err) {}

    return e.json(200, { contacts, estrategia, proximo_passo })
  },
  $apis.requireAuth(),
)
