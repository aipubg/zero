import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { recognizedTextWrapperOptions, createRecognizedTextWrapper } from '../backend/gateway/server/local-chat-wrapper.mjs';
import * as sdk from '../backend/node_modules/node-llama-cpp/dist/index.js';

test('[CONTRACT] exact registered multimodal template text projection retains model role boundaries', async t => {
  const model = 'models/SmolVLM-256M/SmolVLM-256M-Instruct-Q8_0.gguf';
  if (!fs.existsSync(model)) { t.skip('BLOCKED: pinned SmolVLM GGUF prerequisite is not provisioned'); return; }
  const info = await sdk.readGgufFileInfo(model);
  const template = info.metadata.tokenizer.chat_template;
  const options = recognizedTextWrapperOptions(template);
  assert.ok(options);
  assert.equal(recognizedTextWrapperOptions(template + 'changed'), null);
  assert.equal(recognizedTextWrapperOptions(undefined), null);
  const wrapper = createRecognizedTextWrapper(template, sdk);
  const state = wrapper.generateContextState({ chatHistory: [{ type: 'system', text: 'Be concise' }, { type: 'user', text: 'हिंदी' }, { type: 'model', response: [] }] });
  assert.equal(state.contextText.toString(), '<|im_start|>System: Be concise<end_of_utterance>\nUser: हिंदी<end_of_utterance>\nAssistant:');
});
