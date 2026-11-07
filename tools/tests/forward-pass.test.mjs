import { readFile } from "node:fs/promises";
import vm from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";

const html = await readFile(
  new URL("../../app/src/content/embeds/d3-forward-pass.html", import.meta.url),
  "utf8",
);
const model = vm.runInNewContext(
  html.split("// BEGIN FORWARD PASS MODEL")[1].split("// END FORWARD PASS MODEL")[0] +
    "; ForwardPassModel",
  { Intl },
);
const data = JSON.parse(
  await readFile(
    new URL("../../app/src/content/assets/data/forward-pass/tokens.json", import.meta.url),
    "utf8",
  ),
);
const prompt = data.promptTokenization.tokens.map((token, index) => ({ ...token, index }));
const output = data.outputTokenization.tokens.map((token, index) => ({ ...token, index }));
const frames = model.buildForwardPassFrames(prompt, output);

test("captured tokens and grapheme grouping preserve the biography, including emoji", () => {
  assert.equal(prompt.length, 5);
  assert.equal(output.length, 128);
  assert.equal(prompt.map((t) => t.text).join(""), data.prompt);
  assert.equal(output.map((t) => t.text).join(""), data.output);
  const groups = model.groupTokensByGrapheme(output);
  assert.equal(groups.map((g) => g.text).join(""), data.output);
  assert.equal(groups.flatMap((g) => g.tokens).length, output.length);
  assert.ok(groups.some((g) => g.tokens.length > 1));
});

test("storyboard fills the prompt cache, emits tokens in order and finishes losslessly", () => {
  assert.equal(frames.length, 139);
  assert.equal(frames.filter((f) => f.phase === "tokenize").length, 5);
  assert.deepEqual(
    Array.from(
      frames.filter((f) => f.phase === "prefill"),
      (f) => f.activeStage,
    ),
    ["embed", "qkv", "attention", "mlp", "logits", "sample"],
  );
  for (const frame of frames) {
    assert.ok(frame.kvCacheLength <= frame.context.length);
    assert.equal(
      frame.emittedTokens.map((t) => t.text).join(""),
      output
        .slice(0, frame.emittedTokens.length)
        .map((t) => t.text)
        .join(""),
    );
    if (frame.sampledToken) {
      assert.equal(frame.sampledToken.id, output[frame.step].id);
      assert.equal(
        frame.logits.find((t) => t.selected).text,
        frame.sampledToken.text || `#${frame.sampledToken.id}`,
      );
    }
  }
  assert.equal(frames.at(-1).kvCacheLength, 133);
  assert.equal(
    frames
      .at(-1)
      .emittedTokens.map((t) => t.text)
      .join(""),
    data.output,
  );
});

test("causal attention and candidate shortlists stay normalized, with greedy selection", () => {
  for (const frame of frames) {
    for (const head of model.ATTENTION_HEADS) {
      const edges = frame.attention.filter((e) => e.head === head.index);
      if (!edges.length) continue;
      assert.ok(Math.abs(edges.reduce((sum, e) => sum + e.weight, 0) - 1) < 1e-12);
      assert.ok(edges.every((e) => e.keyIndex <= frame.queryIndex && e.weight >= 0));
    }
    if (frame.logits.length) {
      assert.ok(Math.abs(frame.logits.reduce((sum, t) => sum + t.probability, 0) - 1) < 1e-12);
      assert.equal(frame.logits.filter((t) => t.selected).length, 1);
      assert.ok(frame.logits[0].selected);
      assert.ok(frame.logits.every((t) => t.probability <= frame.logits[0].probability));
    }
    assert.ok(frame.activations.every((a) => a >= 0 && a <= 1));
  }
});
