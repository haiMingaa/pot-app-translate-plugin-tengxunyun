async function translate(text, from, to, options) { 
    const { config, utils } = options;
    const { tauriFetch: fetch } = utils;
    
    // === 从配置中读取 API Key 和模型名 ===
    let { apiKey, model = "hunyuan-turbos-latest" } = config;
    
    // === 腾讯混元 Chat Completions 接口 ===
    const requestPath = "https://api.hunyuan.cloud.tencent.com/v1/chat/completions";
    
    // === 请求头 ===
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
    };
    
    // === 请求体 ===
    const body = {
        model: model,
        messages: [
            {
                role: "system",
                content: "You are a professional translation engine. Please translate the text into a natural, fluent, and professional tone. Only translate the text; do not explain or comment."
            },
            {
                role: "user",
                content: `Translate this text from ${from} to ${to}:\n${text}`
            }
        ],
        temperature: 0.1,
        top_p: 0.99,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 2000
    };

    // === 发起 POST 请求 ===
    let res = await fetch(requestPath, {
        method: "POST",
        headers: headers,
        body: {
            type: "Json",  // Tauri Fetch 特有格式
            payload: body
        }
    });

    // === 处理返回结果 ===
    if (res.ok) {
        const result = res.data;
        if (result.choices && result.choices.length > 0) {
            const translation = result.choices[0].message.content.trim();
            return translation.replace(/^"|"$/g, ""); // 去掉可能的引号
        } else {
            throw `Unexpected API Response:\n${JSON.stringify(result, null, 2)}`;
        }
    } else {
        throw `Http Request Error\nStatus: ${res.status}\n${JSON.stringify(res.data, null, 2)}`;
    }
}
