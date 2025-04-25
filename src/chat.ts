import type { Env } from './types';

export async function handleRequest(request: Request, env: Env) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    try {
        const { message, model } = await request.json() as { message: string, model: string }
        console.log('model', model)

        const requestBody = buildRequestBody(message, model)

        console.log('env.API_KEY', env.API_KEY);
        const apiResponse = await fetch('https://hk.uniapi.io/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.API_KEY}`
            },
            body: JSON.stringify(requestBody)
        })

        if (!apiResponse.ok) {
            const errorData = await apiResponse.text()
            console.error('API Error:', errorData)
            return new Response(JSON.stringify({ error: 'Failed to get response from AI service' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const responseData = await apiResponse.json() as { choices: { message: { content: string } }[] }

        return new Response(JSON.stringify({ message: responseData.choices[0].message.content }), {
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error: unknown) {
        console.error('Error:', error instanceof Error ? error.message : error)
        return new Response(JSON.stringify({ error: 'Failed to get response from AI service' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

function buildRequestBody(message: string, model: string) {
    const requestBody: {
        model: string,
        messages: { role: string, content: string }[],
        temperature?: number
    } = {
        model,
        messages: [{ role: 'user', content: message }],
    }

    if (model === 'o1-mini') {
        requestBody.temperature = 1
    } else if (model !== 'o1' && model !== 'o3-mini') {
        requestBody.temperature = 0.7
    }

    return requestBody
}