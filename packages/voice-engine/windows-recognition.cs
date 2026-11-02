using System;
using System.Collections.Generic;
using System.IO;
using System.Speech.AudioFormat;
using System.Speech.Recognition;
using System.Threading;

namespace Zero.Voice {
    public class RecognizedSegment {
        public string text;
        public float confidence;
        public double startMs;
        public double durationMs;
    }
    public static class Recognition {
        // This consumes a finite PCM stream, never the system microphone.
        public static RecognizedSegment[] Transcribe(byte[] pcm, int sampleRate, string language) {
            RecognizerInfo selected = null;
            foreach (RecognizerInfo info in SpeechRecognitionEngine.InstalledRecognizers()) {
                if (String.IsNullOrEmpty(language) || String.Equals(info.Culture.Name, language, StringComparison.OrdinalIgnoreCase)) {
                    selected = info;
                    break;
                }
            }
            if (selected == null) throw new InvalidOperationException("No Windows speech recognizer installed for " + (language ?? "the default language") + ". Install the Windows speech language pack.");
            using (SpeechRecognitionEngine engine = new SpeechRecognitionEngine(selected))
            using (MemoryStream stream = new MemoryStream(pcm))
            using (ManualResetEvent completed = new ManualResetEvent(false)) {
                List<RecognizedSegment> segments = new List<RecognizedSegment>();
                Exception failure = null;
                engine.LoadGrammar(new DictationGrammar());
                engine.SetInputToAudioStream(stream, new SpeechAudioFormatInfo(sampleRate, AudioBitsPerSample.Sixteen, AudioChannel.Mono));
                engine.SpeechRecognized += (sender, args) => {
                    if (!String.IsNullOrWhiteSpace(args.Result.Text)) segments.Add(new RecognizedSegment {
                        text = args.Result.Text, confidence = args.Result.Confidence,
                        startMs = args.Result.Audio.AudioPosition.TotalMilliseconds,
                        durationMs = args.Result.Audio.Duration.TotalMilliseconds
                    });
                };
                engine.RecognizeCompleted += (sender, args) => { failure = args.Error; completed.Set(); };
                engine.RecognizeAsync(RecognizeMode.Multiple);
                if (!completed.WaitOne(110000)) {
                    engine.RecognizeAsyncCancel();
                    // Keep the event alive until the engine has dispatched cancellation.
                    completed.WaitOne(5000);
                    throw new TimeoutException("Windows speech recognition timed out");
                }
                if (failure != null) throw failure;
                return segments.ToArray();
            }
        }
    }
}
