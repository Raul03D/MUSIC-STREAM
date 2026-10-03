const crypto = require("crypto");

function decryptMediaUrl(encrypted) {
  if (!encrypted) return null;
  try {
    const key = Buffer.from("38346591", "utf-8");
    const decipher = crypto.createDecipheriv("des-ecb", key, "");
    let decrypted = decipher.update(encrypted, "base64", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted.replace("_96.mp4", "_160.mp4");
  } catch (e) {
    return null;
  }
}

async function testAll() {
  const genres = [
    { name: "Hindi", q: "hindi songs" },
    { name: "Bengali", q: "bengali songs" },
    { name: "English", q: "english pop hits" },
    { name: "Bollywood", q: "bollywood party hits" },
    { name: "Pop", q: "top pop songs" },
    { name: "Lo-Fi", q: "lofi chill" },
    { name: "Synthwave", q: "synthwave" },
    { name: "Electronic", q: "electronic edm" },
  ];

  for (const g of genres) {
    const url =
      "https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&p=1&n=5&q=" +
      encodeURIComponent(g.q);
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const data = await res.json();
    const first = (data.results || []).find((r) => r.encrypted_media_url);
    if (first) {
      const fullUrl = decryptMediaUrl(first.encrypted_media_url);
      console.log(
        `${g.name}: "${first.song || first.title}" | Duration: ${first.duration}s | Full URL: ${fullUrl?.slice(0, 50)}...`
      );
    } else {
      console.log(`${g.name}: No encrypted_media_url found`);
    }
  }
}

testAll().catch(console.error);
