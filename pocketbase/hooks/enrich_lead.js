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

    const prompt = `Identifique 3 possíveis executivos ou contatos-chave (como Gerente de Vendas, Diretor de Marketing, CEO) para uma empresa brasileira chamada "${razaoSocial}".
  Retorne APENAS um array JSON de objetos, com as chaves:
  - "nome" (string)
  - "cargo" (string)
  - "linkedin_url" (string simulada)
  - "instagram_url" (string simulada)
  - "rede_social" (string, "linkedin" ou "instagram")
  - "bio" (string curta)
  - "foto_perfil" (use "https://img.usecurling.com/ppl/thumbnail?seed=" + um numero aleatorio de 1 a 1000)
  Seja realista nos nomes. Exemplo de retorno:
  [{"nome": "Carlos Silva", "cargo": "Diretor Comercial", "linkedin_url": "https://linkedin.com/in/carlos-silva-ex", "instagram_url": "https://instagram.com/carlossilva", "rede_social": "linkedin", "bio": "Especialista em vendas B2B", "foto_perfil": "https://img.usecurling.com/ppl/thumbnail?seed=42"}]`

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
    try {
      const content = JSON.parse(res.json.choices[0].message.content)
      contacts = Array.isArray(content) ? content : content.contatos || content.contacts || []
    } catch (err) {
      return e.internalServerError('Falha ao parsear contatos gerados')
    }

    return e.json(200, { contacts })
  },
  $apis.requireAuth(),
)
