// SMOKE TEST v2: checks how many of the newest reviews are complaints.
const SETTINGS = {
  app_id: 'com.nextbillion.groww',
  store_country: 'in',
  store_language: 'en',
  fetch_window: 200,
  complaint_max_rating: 3,
  min_words: 4,
  max_reviews: 30
};

function countWords(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

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
      num: SETTINGS.fetch_window
    });
    const list = Array.isArray(result) ? result : result.data;
    const lowRating = list.filter((r) => r.score <= SETTINGS.complaint_max_rating);
    const longEnough = list.filter((r) => countWords(r.text) >= SETTINGS.min_words);
    const candidates = list.filter(
      (r) => r.score <= SETTINGS.complaint_max_rating && countWords(r.text) >= SETTINGS.min_words
    );
    const shown = candidates.slice(0, SETTINGS.max_reviews);
    const stars = [1, 2, 3, 4, 5]
      .map((n) => n + ' star: ' + list.filter((r) => r.score === n).length)
      .join(', ');
    const seconds = (Date.now() - startedAt) / 1000;
    const oldest = list.length ? list[list.length - 1].date : 'n/a';
    const message =
      'Fetched ' + list.length + ' newest reviews (' + stars + '). Oldest one: ' + oldest + '. ' +
      lowRating.length + ' had ' + SETTINGS.complaint_max_rating + ' stars or fewer, ' +
      longEnough.length + ' had at least ' + SETTINGS.min_words + ' words, and ' +
      candidates.length + ' had both. Showing ' + shown.length + ' of those. Took ' + seconds + ' seconds.';
    // Reviewer names are deliberately left out.
    const reviews = shown.map((r) => ({
      id: r.id,
      score: r.score,
      date: r.date,
      text: r.text,
      thumbsUp: r.thumbsUp
    }));
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, message, count: reviews.length, seconds, reviews }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, seconds: (Date.now() - startedAt) / 1000, error: String(err && err.message ? err.message : err) }));
  }
};
