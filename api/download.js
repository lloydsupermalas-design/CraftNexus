export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const fileUrl = req.query.url;

    if (!fileUrl) {
      return res.status(400).json({
        error: "URL file tidak ditemukan"
      });
    }

    const allowedHosts = [
      "cdn.modrinth.com",
      "cdn-raw.modrinth.com"
    ];

    const url = new URL(fileUrl);

    if (!allowedHosts.includes(url.hostname)) {
      return res.status(403).json({
        error: "Sumber file tidak diizinkan"
      });
    }

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: "File gagal diambil"
      });
    }

    const contentType =
      response.headers.get("content-type") ||
      "application/octet-stream";

    const contentLength =
      response.headers.get("content-length");

    res.setHeader(
      "Content-Type",
      contentType
    );

    res.setHeader(
      "Content-Disposition",
      "attachment"
    );

    if (contentLength) {
      res.setHeader(
        "Content-Length",
        contentLength
      );
    }

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    return res.status(200).send(buffer);

  } catch (error) {
    return res.status(500).json({
      error: "Gagal mengunduh file"
    });
  }
        }
