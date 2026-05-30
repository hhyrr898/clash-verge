export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = env.BING_INDEXNOW_KEY || "";

    if (key && url.pathname === `/${key}.txt`) {
      return new Response(key, {
        headers: { "content-type": "text/plain;charset=UTF-8" }
      });
    }

    return fetch(request);
  }
};
