export function idYoutube(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function urlIncorporada(url: string): string {
  const id = idYoutube(url);
  if (id) return `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`;
  if (/\.pdf($|\?)/i.test(url)) {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
  }
  return url;
}