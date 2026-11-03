import { createHash } from 'node:crypto';

export function recognizedTextWrapperOptions(template) {
  if (typeof template !== 'string') return null;
  if (createHash('sha256').update(template).digest('hex') !== '830005085ddd94cec605b6e21b885b28ffad6e3f82ee6a212c523533e8f04f01') return null;
  // Exact text-only projection of this known multimodal Jinja template.
  // Image inputs need the separate vision runtime; this adapter certifies none.
  return {
    template: '<|im_start|>{{history}}Assistant:{{completion}}<end_of_utterance>\n',
    historyTemplate: {
      system: 'System: {{message}}<end_of_utterance>\n',
      user: 'User: {{message}}<end_of_utterance>\n',
      model: 'Assistant: {{message}}<end_of_utterance>\n',
    },
    joinAdjacentMessagesOfTheSameType: false,
  };
}

export function createRecognizedTextWrapper(template, sdk) {
  const options = recognizedTextWrapperOptions(template);
  if (!options) return undefined;
  return new class extends sdk.TemplateChatWrapper {
    generateContextState(input) {
      const state = super.generateContextState(input);
      const last = input.chatHistory.at(-1);
      // SDK 3.22.2 omits completionPrefix for an empty model response. Native
      // generation starts with precisely that history shape.
      if (last?.type === 'model' && last.response.length === 0) {
        state.contextText = sdk.LlamaText(state.contextText, new sdk.SpecialTokensText('Assistant:'));
      }
      return state;
    }
  }(options);
}
