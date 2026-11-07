# Forward-pass snapshot

`app/src/content/assets/data/forward-pass/tokens.json` records the fixed prompt and biography, together with their token IDs
and lossless text fragments returned by `https://www.cris96spa-latent-space.com/api/tokenize`
using POST bodies of the form `{"text": "..."}`. The snapshot contains 5 prompt tokens
and 128 biography tokens. Byte-fragment tokens are grouped into graphemes for display;
the IDs retain the tokenizer's original sequence.

The source text and deterministic storyboard are from
[Latent Space](https://github.com/cris96spa/latent-space/tree/db0d2bc83743748efe220886b3fbd603541a9f74),
revision `db0d2bc83743748efe220886b3fbd603541a9f74`. Its MIT notice is in the adjacent `LICENSE` file.
The standalone embed contains the model and renderer. This JSON is data only.

Attention, embedding colors, hidden activations and candidate scores are scripted.
Candidate probabilities normalize a small illustrative shortlist; they do not report
probabilities over GPT-2's vocabulary. The illustration performs no inference and
makes no requests to the original site's backend at runtime.

Inter and JetBrains Mono font files and their licenses are in
`app/public/fonts/latent-space/`. Scoped light and dark color tokens preserve the
homepage's visual identity while following the template's theme switch.
