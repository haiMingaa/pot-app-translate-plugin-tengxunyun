async function translate(text, from, to, options) { 
    const { config, utils } = options;
    const { tauriFetch: fetch } = utils;
    
    let { apiKey, model = "hunyuan-turbos-latest" } = config;

    if (!apiKey) {
        throw "Missing Hunyuan API Key. Please set it in plugin configuration.";
    }

    const requestPath = "https://api.hunyuan.cloud.tencent.com/v1/chat/completions";

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
    };

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
        "enable_enhancement": true
    };

    // ✅ 关键修改：使用 type + payload
    let res = await fetch(requestPath, {
        method: "POST",
        headers: headers,
        body: {
            type: "Json",     // 告诉 Tauri 这是 JSON 请求体
            payload: body     // 直接放对象，不要 stringify
        }
    });

    if (res.ok) {
        const result = res.data;
        if (result.choices && result.choices.length > 0) {
            const translation = result.choices[0].message.content.trim();
            return translation.replace(/^"|"$/g, "");
        } else {
            throw `Unexpected API Response:\n${JSON.stringify(result, null, 2)}`;
        }
    } else {
        throw `Http Request Error\nStatus: ${res.status}\n${JSON.stringify(res.data, null, 2)}`;
    }
}
