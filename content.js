export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    search = "",
    category = "",
    page = "0"
  } = req.query;

  try {
    /*
      Bedrock memakai backend CraftNexus.
      Sumber konten dimasukkan melalui CURSEFORGE_API_KEY
      di Environment Variables Vercel.
    */

    const apiKey = process.env.CURSEFORGE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "CURSEFORGE_API_KEY belum dipasang di Vercel."
      });
    }

    const params = new URLSearchParams();

    params.set("gameId", "432");
    params.set("pageSize", "24");
    params.set("index", String(Number(page) * 24));

    if (search) {
      params.set("searchFilter", search);
    }

    if (category) {
      params.set("classId", category);
    }

    const response = await fetch(
      "https://api.curseforge.com/v1/mods/search?" +
      params.toString(),
      {
        headers: {
          "x-api-key": apiKey,
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      const text = await response.text();

      return res.status(response.status).json({
        error: "CurseForge API error",
        details: text
      });
    }

    const data = await response.json();

    const items = (data.data || []).map(item => ({
      id: String(item.id),
      platform: "bedrock",
      title: item.name || "Untitled",
      creator:
        item.authors?.[0]?.name || "Unknown",
      category:
        item.class?.name || "Minecraft",
      version: "Bedrock",
      type: "mcaddon",
      size: "",
      uploaded:
        item.dateCreated || "",
      updated:
        item.dateModified || "",
      rating:
        item.rating || 0,
      downloads:
        item.downloadCount || 0,
      image:
        item.logo?.url || "",
      screenshots:
        (item.screenshots || [])
          .map(x => x.url)
          .filter(Boolean),
      description:
        item.summary || "",
      downloadUrl: ""
    }));

    return res.status(200).json({
      items,
      pagination: data.pagination || {}
    });

  } catch (error) {
    return res.status(500).json({
      error: "Gagal mengambil konten Bedrock.",
      details: error.message
    });
  }
               }
