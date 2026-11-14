import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

interface GroundingWebChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

interface SearchSource {
  title: string;
  uri: string;
}

interface LpmppSearchPayload {
  summary: string;
  sources: SearchSource[];
  fetchedAt: string;
  mode: 'gemini-grounding' | 'portal-direct';
  notice?: string;
}

// 30-minute in-memory cache to minimize repeated Gemini API quota usage
const CACHE_TTL_MS = 30 * 60 * 1000;
const searchCache = new Map<
  string,
  { expiresAt: number; payload: LpmppSearchPayload }
>();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isQuotaOrRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.toLowerCase().includes('quota') ||
    msg.toLowerCase().includes('rate limit')
  );
}

function formatFriendlyGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (isQuotaOrRateLimitError(err)) {
    return 'Kuota Gemini API pada key yang terpasang sedang tercapai (429 RESOURCE_EXHAUSTED). Anda dapat meningkatkan kuota dengan memilih API key berbayar di panel Settings > Secrets.';
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED')) {
    return 'API key Gemini tidak valid atau tidak memiliki izin. Silakan periksa kembali key Anda di panel Settings > Secrets.';
  }
  return 'Layanan pencarian sedang mengalami gangguan sementara. Silakan coba beberapa saat lagi.';
}

function stripHtmlTags(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#8211;|&ndash;/gi, '–')
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

interface WpPostItem {
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  link?: string;
  date?: string;
}

async function fetchDirectPortalNews(
  topic: string,
  portalUrl: string
): Promise<LpmppSearchPayload> {
  const endpoints = [
    {
      name: 'LPMPP Universitas Pattimura',
      url: 'https://lpmpp.unpatti.ac.id/wp-json/wp/v2/posts?per_page=5',
    },
    {
      name: 'Universitas Pattimura',
      url: 'https://unpatti.ac.id/wp-json/wp/v2/posts?per_page=4',
    },
  ];

  const collectedPosts: {
    portal: string;
    title: string;
    excerpt: string;
    link: string;
    date: string;
  }[] = [];

  await Promise.all(
    endpoints.map(async (ep) => {
      try {
        const resp = await fetch(ep.url, {
          signal: AbortSignal.timeout(4500),
          headers: { Accept: 'application/json' },
        });
        if (!resp.ok) return;
        const data = (await resp.json()) as WpPostItem[];
        if (!Array.isArray(data)) return;
        data.forEach((post) => {
          const title = stripHtmlTags(post.title?.rendered || '');
          const excerpt = stripHtmlTags(post.excerpt?.rendered || '');
          if (title && post.link) {
            collectedPosts.push({
              portal: ep.name,
              title,
              excerpt: excerpt.slice(0, 140),
              link: post.link,
              date: post.date ? post.date.slice(0, 10) : '',
            });
          }
        });
      } catch {
        // Ignore individual portal timeout/network error
      }
    })
  );

  const keywords = topic
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const ranked = [...collectedPosts].sort((a, b) => {
    const score = (item: typeof a) =>
      keywords.reduce(
        (acc, kw) =>
          acc +
          (item.title.toLowerCase().includes(kw) ? 2 : 0) +
          (item.excerpt.toLowerCase().includes(kw) ? 1 : 0),
        0
      );
    return score(b) - score(a);
  });

  const topPosts = ranked.slice(0, 4);
  const bullets: string[] = [];

  if (topPosts.length > 0) {
    topPosts.forEach((p) => {
      bullets.push(
        `• [${p.portal}${p.date ? ` · ${p.date}` : ''}] ${p.title}${
          p.excerpt ? ` — ${p.excerpt}...` : ''
        }`
      );
    });
  } else {
    bullets.push(
      '• Panduan Pengisian Borang: Alumni mengisi identitas prodi & tahun lulus (F1–F2d), riwayat pencarian kerja (F3–F7a), status kerja (F8–F10), detail pekerjaan/pendapatan (F11–F16 jika bekerja), serta 29 butir kompetensi (F17a–F17b).',
      '• Indikator Kinerja Utama (IKU 1): Lulusan dikategorikan bekerja layak apabila masa tunggu ≤ 6 bulan setelah lulus dengan pendapatan ≥ 1,2× UMP Provinsi Maluku, melanjutkan studi, atau berwirausaha.',
      '• Layanan Verifikasi & Rujukan Resmi: Setelah pengiriman berhasil, alumni menerima Nomor Tiket Resmi yang dapat dicetak sebagai bukti keikutsertaan Tracer Study LPMPP Universitas Pattimura.'
    );
  }

  const sources: SearchSource[] = [
    ...topPosts.map((p) => ({ title: p.title, uri: p.link })),
    {
      title: 'Portal Resmi LPMPP SIMPATTI Universitas Pattimura',
      uri: portalUrl,
    },
    {
      title: 'Website Resmi LPMPP Universitas Pattimura',
      uri: 'https://lpmpp.unpatti.ac.id/',
    },
  ].slice(0, 6);

  return {
    summary: bullets.join('\n\n'),
    sources,
    fetchedAt: new Date().toISOString(),
    mode: 'portal-direct',
    notice:
      'Menampilkan pembaruan langsung dari portal resmi LPMPP Universitas Pattimura & pedoman IKU 1 (kuota Gemini API saat ini sedang penuh / 429 RESOURCE_EXHAUSTED).',
  };
}

async function callGeminiSearchWithRetry(
  ai: GoogleGenAI,
  prompt: string,
  model: string,
  useSearchTool: boolean
) {
  const maxAttempts = 2;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: useSearchTool
          ? { tools: [{ googleSearch: {} }] }
          : undefined,
      });
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts && isQuotaOrRateLimitError(err)) {
        await new Promise((resolve) => setTimeout(resolve, 650 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.post('/api/lpmpp-search', async (req: Request, res: Response) => {
    const rawQuery =
      typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    const portalUrl =
      typeof req.body?.portalUrl === 'string' && req.body.portalUrl.trim()
        ? req.body.portalUrl.trim()
        : 'https://portallpmpp.simpatti.site/';

    const topic =
      rawQuery ||
      'berita akademik terbaru dan panduan pengisian Tracer Study LPMPP Universitas Pattimura';

    const cacheKey = `${topic.toLowerCase()}::${portalUrl}`;
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.json(cached.payload);
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      const directPayload = await fetchDirectPortalNews(topic, portalUrl);
      res.json(directPayload);
      return;
    }

    const prompt = [
      `Cari informasi terkini dan resmi terkait: "${topic}".`,
      `Fokuskan pencarian pada portal resmi LPMPP Universitas Pattimura (${portalUrl}, lpmpp.unpatti.ac.id, tracer.simpatti.site, unpatti.ac.id) serta pedoman resmi Tracer Study / IKU 1 Kemendikbudristek.`,
      'Susun ringkasan singkat, faktual, dan terstruktur dalam Bahasa Indonesia (maksimal 4 poin ringkas) yang bermanfaat bagi alumni Universitas Pattimura saat mengisi borang Tracer Study.',
      'Jika hasil spesifik dari portal internal tidak terindeks publik, sampaikan panduan resmi Universitas Pattimura / DIKTI yang relevan secara jujur tanpa mengarang informasi.',
    ].join(' ');

    try {
      let response;
      try {
        response = await callGeminiSearchWithRetry(
          ai,
          prompt,
          'gemini-4-hydrogen',
          true
        );
      } catch (primaryErr) {
        if (isQuotaOrRateLimitError(primaryErr)) {
          // Fallback to lighter model with search grounding
          response = await callGeminiSearchWithRetry(
            ai,
            prompt,
            'gemini-3.1-flash-lite',
            true
          );
        } else {
          throw primaryErr;
        }
      }

      const summary = response.text?.trim() || '';
      const rawChunks =
        (response.candidates?.[0]?.groundingMetadata
          ?.groundingChunks as GroundingWebChunk[] | undefined) || [];

      const seenUris = new Set<string>();
      const sources: SearchSource[] = rawChunks
        .filter((chunk) => chunk?.web?.uri)
        .map((chunk) => ({
          title: chunk.web?.title || chunk.web?.uri || 'Sumber LPMPP / Resmi',
          uri: chunk.web?.uri || '',
        }))
        .filter((item) => {
          if (!item.uri || seenUris.has(item.uri)) return false;
          seenUris.add(item.uri);
          return true;
        })
        .slice(0, 6);

      const payload: LpmppSearchPayload = {
        summary,
        sources,
        fetchedAt: new Date().toISOString(),
        mode: 'gemini-grounding',
      };

      searchCache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        payload,
      });

      res.json(payload);
    } catch (err) {
      if (isQuotaOrRateLimitError(err)) {
        const directPayload = await fetchDirectPortalNews(topic, portalUrl);
        searchCache.set(cacheKey, {
          expiresAt: Date.now() + 5 * 60 * 1000,
          payload: directPayload,
        });
        res.json(directPayload);
        return;
      }

      res.status(500).json({ error: formatFriendlyGeminiError(err) });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `SIM-TracerStudy Unpatti server running on http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
