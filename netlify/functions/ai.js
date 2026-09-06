exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { message, platform, contents } =
      JSON.parse(event.body || "{}");

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Pesan kosong" })
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "OPENAI_API_KEY belum dipasang di Netlify"
        })
      };
    }

    const siteContents = Array.isArray(contents)
      ? contents
      : [];

    const filteredContents = siteContents.filter(item =>
      String(item.platform || "").toLowerCase() ===
      String(platform || "").toLowerCase()
    );

    const contentText = filteredContents.map(item => `
Nama: ${item.name || ""}
Platform: ${item.platform || ""}
Kategori: ${item.category || ""}
Versi: ${item.version || ""}
Deskripsi: ${item.description || ""}
`).join("\n---\n");

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-5.6",
          input: [
            {
              role: "system",
              content:
                "Kamu adalah AI CraftNexus. Jawab hanya berdasarkan konten CraftNexus yang diberikan. Jangan mengarang addon, mod, texture pack, versi, atau informasi yang tidak ada. Jika konten tidak tersedia, katakan bahwa konten tersebut belum tersedia di CraftNexus. Jawab dalam bahasa Indonesia dan singkat."
            },
            {
              role: "user",
              content: `Platform: ${platform}

Daftar konten CraftNexus:
${contentText}

Pertanyaan:
${message}`
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data.error?.message || "Gagal menghubungi AI"
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answer: data.output_text ||
          "AI tidak memberikan jawaban."
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
