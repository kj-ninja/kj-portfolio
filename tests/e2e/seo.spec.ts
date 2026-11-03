import { expect, test } from "@playwright/test";

test("robots.txt allows crawling and names the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("Sitemap: https://krzysztofjakubiak.com/sitemap-index.xml");
});

test("sitemap lists both locales with alternates", async ({ request }) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.status()).toBe(200);
  expect(await index.text()).toContain("<loc>https://krzysztofjakubiak.com/sitemap-0.xml</loc>");
  const sitemap = await request.get("/sitemap-0.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("https://krzysztofjakubiak.com/pl/lab/");
  expect(xml).toContain('hreflang="en"');
  expect(xml).toContain('hreflang="pl"');

  const urls = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  const plLab = urls.find((url) => url.includes("<loc>https://krzysztofjakubiak.com/pl/lab/</loc>"));
  expect(plLab, "<url> for /pl/lab/").toBeDefined();
  expect(plLab).toContain('hreflang="en" href="https://krzysztofjakubiak.com/lab/"');

  expect(xml).not.toContain("/404/");
  expect(xml).not.toContain("/pl/404/");
});

for (const locale of ["en", "pl"]) {
  test(`og image for ${locale} exists and is a PNG`, async ({ request }) => {
    const res = await request.get(`/og/${locale}.png`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    const bytes = await res.body();
    expect(bytes.length).toBeGreaterThan(10_000);
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  });
}
