import type { Env } from './types';

export async function generateImage(request: Request, env: Env) {
  const { message, model } = await request.json() as { message: string, model: string }

  const requestBody = buildRequestBody(message, model);

  try {
    // default host name: oneapi.gptnb.ai
    // host name: oneapi-cn.gptnb.ai
    // another vender https://hk.uniapi.io
    const response = await fetch('https://hk.uniapi.io/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json() as { data: { url: string, revised_prompt: string }[] }
    return new Response(JSON.stringify({ image: data.data[0].url, revised_prompt: data.data[0].revised_prompt }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: unknown) {
    console.error('Error:', error instanceof Error ? error.message : error)
    return new Response(JSON.stringify({ error: 'Failed to get response from AI service' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
}


function buildRequestBody(message: string, model: string) {
  let requestBody = {}

  if (model === 'dall-e-3') {
    requestBody = {
      prompt: message,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
      model,
    }
  }

  if (model === 'gpt-4-image' || model === 'gpt-4o-image') {
    requestBody = {
      model,
      messages: [{ role: 'user', content: message }],
    }
  }

  return requestBody;
}
