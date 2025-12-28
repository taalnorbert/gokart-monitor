export interface KartData {
  kartNo: string;
  driver: string;
  lastLap: string;
  bestLap: string;
  gap: string;
  laps: number;
}

export const parseApexMessage = (msg: string): KartData[] => {
  if (!msg.startsWith('grid||')) return [];

  const html = msg.slice(6);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const results: KartData[] = [];

  // Az összes adat-sort megkeressük (kihagyva a fejlécet, ha van)
  const rows = doc.querySelectorAll('tr[data-id]');
  
  rows.forEach(row => {
    // Az r0 a fejléc, azt kihagyjuk
    if (row.getAttribute('data-id') === 'r0') return;

    // Kinyerjük a cellákat a class-ok alapján, amiket az előbb elemeztünk
    const kartNo = row.querySelector('.no div')?.textContent?.trim() || "";
    const driver = row.querySelector('.dr')?.textContent?.trim() || "";
    const lastLap = row.querySelector('.llp')?.textContent?.trim() || ""; // utolso kor
    const bestLap = row.querySelector('.blp')?.textContent?.trim() || ""; // legjobb kor
    const gap = row.querySelector('.gap')?.textContent?.trim() || "";
    const lapsStr = row.querySelector('.tlp')?.textContent?.trim() || "0";

    if (kartNo && driver) {
      results.push({
        kartNo,
        driver,
        lastLap,
        bestLap,
        gap,
        laps: parseInt(lapsStr)
      });
    }
  });

  return results;
};
