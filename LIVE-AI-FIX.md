# Live AI Finder data fix

The Finder was reporting that live data was still loading because `index.html` referenced `live-ai-data.js`, but that producer file was absent from the merged repository. This change restores the live data ingestion layer for OpenRouter and Hugging Face.
