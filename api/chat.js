export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body;

  // 会話履歴をGemini形式に変換
  const contents = [
    ...(history || []),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: `あなたはフィギュアスケートの元選手でAIコーチの「ARIA」です。
ジャンプ技術・採点ルール・選手情報・試合結果など、フィギュアスケートに関する質問に競技者視点で丁寧に日本語で答えてください。
スケート以外の質問には「フィギュアスケートのことなら何でも聞いてください⛸」と返してください。`
            }]
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Gemini API error' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'エラーが発生しました';
    const updatedHistory = [
      ...(history || []),
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text }] }
    ];

    res.status(200).json({ text, history: updatedHistory });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
