import logging
import requests
import time
import pandas as pd
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class NewsScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive',
        })
        self.min_interval = 1

    def _scrape_bisnis(self, symbol: str, limit: int) -> pd.DataFrame | None:
        try:
            results = []
            page = 1
            while len(results) < limit:
                scrape_url = f"https://search.bisnis.com/?q={symbol}&page={page}"
                response = self.session.get(scrape_url)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')
                page_results = [h4.get_text(strip=True) for h4 in soup.find_all("h4", class_="artTitle")]
                if not page_results:
                    break
                results.extend(page_results)
                page += 1
                time.sleep(self.min_interval)
            return pd.DataFrame({"news": results[:limit]})
        except Exception as e:
            logger.error("Failed to scrape Bisnis for %s: %s", symbol, e)
            return None

    def _scrape_kontan(self, symbol: str, limit: int) -> pd.DataFrame | None:
        try:
            results = []
            while len(results) < limit:
                scrape_url = f"https://www.kontan.co.id/search/?search={symbol}"
                response = self.session.get(scrape_url)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')
                anchors = soup.find("div", class_="list-berita").select("ul > li div.ket div.sp-hl.linkto-black h1 a")
                page_results = [a.get_text(strip=True) for a in anchors]
                if not page_results:
                    break
                results.extend(page_results)
                time.sleep(self.min_interval)
            return pd.DataFrame({"news": results[:limit]})
        except Exception as e:
            logger.error("Failed to scrape Kontan for %s: %s", symbol, e)
            return None

    def scrape_news(self, symbol: str, limit: int = 10) -> pd.DataFrame | None:
        bisnis_df = self._scrape_bisnis(symbol, limit // 2)
        kontan_df = self._scrape_kontan(
            symbol, limit - len(bisnis_df) if bisnis_df is not None else limit
        )

        frames = [df for df in (bisnis_df, kontan_df) if df is not None and not df.empty]
        if not frames:
            return None

        df = pd.concat(frames).drop_duplicates().reset_index(drop=True)
        return df if not df.empty else None
