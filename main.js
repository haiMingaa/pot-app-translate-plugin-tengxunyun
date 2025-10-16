import OpenAI from "openai";

export async function translate(text， from， 到， options) {
    const { config， utils } = options;
    const { tauriFetch: fetch } = utils; // 若插件环境必须使用 fetch，可保留备用
    let { requestPath: url } = config;

    // ==== 初始化混元 API ====
    const client = new OpenAI({
        apiKey: process。env['HUNYUAN_API_KEY']， // 你需要在环境变量中设置
        baseURL: "https://api.hunyuan.cloud.tencent.com/v1",
    });

    // ==== 构造 prompt ====
    const prompt = `
你是一个专业的翻译助手。请将以下文本从 ${from} 语种 翻译成 ${to} 语种。
只输出翻译后的文本，不要添加解释或额外说明。

文本：
${text}
    `。trim();

    try {
        // ==== 调用腾讯混元模型 ====
        const completion = await client.chat.completions.create({
            model: "hunyuan-turbos-latest"，
            messages: [
                { role: "system", content: "You are a helpful translation assistant." },
                { role: "user", content: prompt }
            ],
            enable_enhancement: true,
        });

        const result = completion.choices[0].message.content;

        if (result) {
            return result.trim();
        } else {
            throw "Empty translation result";
        }
    } catch (err) {
        throw `Hunyuan API Error: ${err}`;
    }
}
