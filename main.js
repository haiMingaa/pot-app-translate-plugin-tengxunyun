async function translate(text, from, to, options) {
    const { config, setResult, utils } = options;
    const { http } = utils;
    const { fetch, Body, ResponseType } = http;

    // 检查 API Key
    if (!config.api_key) {
        throw new Error("Please configure Hunyuan API Key first");
    }

    const requestPath = "https://api.hunyuan.cloud.tencent.com/v1/chat/completions";

    const headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": `Bearer ${config.api_key}`
    };

    // 准备提示词
    const messages = [
        {
            role: "system",
            content:
                "You are a professional translation engine. Translate the following text accurately, fluently, and naturally. Only output the translated text without explanation."
        },
        {
            role: "user",
            content: `Translate from ${from} to ${to}:\n${text}`
        }
    ];

    // 是否流式输出
    const useStream = config.use_stream !== "false";

    // 请求体
    const body = {
        model: config.model || "hunyuan-turbos-latest",
        messages,
        stream: useStream, // ✅ 开启流式输出
        enable_enhancement: true,
        temperature: 0.1,
        top_p: 0.9
    };

    try {
        const response = await fetch(requestPath, {
            method: "POST",
            headers,
            body: Body.json(body),
            responseType: useStream ? ResponseType.Text : ResponseType.JSON
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // ✅ 非流式模式
        if (!useStream) {
            const result = response.data?.choices?.[0]?.message?.content?.trim();
            if (result) return result;
            throw new Error("Invalid response format");
        }

        // ✅ 流式模式解析（SSE）
        let result = "";
        const lines = response.data.split("\n");

        for (const line of lines) {
            if (!line.trim() || !line.startsWith("data:")) continue;

            const dataStr = line.slice(5).trim(); // 去掉 "data: "
            if (dataStr === "[DONE]") break;

            try {
                const json = JSON.parse(dataStr);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                    result += delta;
                    if (setResult) {
                        setResult(result); // 实时更新 UI
                        await new Promise(resolve => setTimeout(resolve, 40)); // 控制刷新频率
                    }
                }
            } catch (e) {
                console.warn("Parse stream error:", e.message, line);
                continue;
            }
        }

        if (!result) throw new Error("No translation result received");

        if (setResult) {
            await new Promise(resolve => setTimeout(resolve, 100));
            setResult(result);
        }

        return result;
    } catch (error) {
        throw new Error(`Hunyuan Translation failed: ${error.message}`);
    }
}
