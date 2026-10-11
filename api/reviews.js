// SMOKE TEST ONLY: proves we can fetch Play Store reviews from Vercel.
const SETTINGS = {
  app_id: 'com.nextbillion.groww',
  store_country: 'in',
  store_language: 'en',
  max_reviews: 30
};

module.exports = async function handler(req, res) {
  const startedAt = Date.now();
  res.setHeader('Content-Type', 'application/json');
  try {
    const mod = await import('google-play-scraper');
    const gplay = mod.default || mod;
    const result = await gplay.reviews({
      appId: SETTINGS.app_id,
      lang: SETTINGS.store_language,
      country: SETTINGS.store_country,
      sort: gplay.sort.NEWEST,
      num: SETTINGS.max_reviews
    });
    const list = Array.isArray(result) ? result : result.data;
    // Reviewer names are deliberately left out.
    const reviews = list.map((r) => ({
      id: r.id,
      score: r.score,
      date: r.date,
      text: r.text,
      thumbsUp: r.thumbsUp
    }));
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, count: reviews.length, seconds: (Date.now() - startedAt) / 1000, reviews }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, seconds: (Date.now() - startedAt) / 1000, error: String(err && err.message ? err.message : err) }));
  }
};
