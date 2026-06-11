import logging
from transformers import pipeline

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    def __init__(self):
        self.analyzer = pipeline(
            "sentiment-analysis",
            model="EgoWidiarto/finbert-indonesia-finansial",
            tokenizer="EgoWidiarto/finbert-indonesia-finansial"
        )
        self.mapping = {"label_0": "negative", "label_1": "neutral", "label_2": "positive"}

    def _analyze_texts(self, texts: list[str]) -> list[dict] | None:
        try:
            sentiments = []
            for text in texts:
                sentiment = self.analyzer(text)[0]
                sentiments.append({
                    "text": text,
                    "label": self.mapping.get(sentiment['label'].lower()),
                    "score": sentiment['score'],
                })
            return sentiments
        except Exception as e:
            logger.error("Sentiment analysis failed: %s", e)
            return None

    def get_summary(self, texts: list[str]) -> dict | None:
        try:
            sentiments = self._analyze_texts(texts)
            if sentiments is None:
                return None
            total = len(sentiments)
            positive = len([s for s in sentiments if s["label"] == "positive"])
            negative = len([s for s in sentiments if s["label"] == "negative"])
            neutral = len([s for s in sentiments if s["label"] == "neutral"])

            weighted_score = []
            for s in sentiments:
                if s["label"] == "positive":
                    weighted_score.append(s["score"])
                elif s["label"] == "negative":
                    weighted_score.append(-s["score"])
                else:
                    weighted_score.append(0)

            return {
                "positive": positive / total,
                "negative": negative / total,
                "neutral": neutral / total,
                "overall": sum(weighted_score),
            }
        except Exception as e:
            logger.error("Sentiment summary failed: %s", e)
            return None
