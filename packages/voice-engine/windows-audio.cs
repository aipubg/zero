// Windows Multimedia PCM16 bridge. No capture occurs during device enumeration.
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;

namespace Zero.Voice {
    public static class NativeAudio {
        [StructLayout(LayoutKind.Sequential, Pack = 2)]
        struct Format {
            public ushort tag, channels;
            public uint samplesPerSecond, bytesPerSecond;
            public ushort blockAlign, bits, extra;
        }
        [StructLayout(LayoutKind.Sequential)]
        struct Header {
            public IntPtr data;
            public uint length, recorded;
            public UIntPtr user;
            public uint flags, loops;
            public IntPtr next;
            public UIntPtr reserved;
        }
        [DllImport("winmm.dll")] public static extern uint waveInGetNumDevs();
        [DllImport("winmm.dll")] public static extern uint waveOutGetNumDevs();
        [DllImport("winmm.dll")] static extern uint waveInOpen(out IntPtr handle, uint device, ref Format format, IntPtr callback, IntPtr instance, uint flags);
        [DllImport("winmm.dll")] static extern uint waveInPrepareHeader(IntPtr handle, IntPtr header, uint size);
        [DllImport("winmm.dll")] static extern uint waveInUnprepareHeader(IntPtr handle, IntPtr header, uint size);
        [DllImport("winmm.dll")] static extern uint waveInAddBuffer(IntPtr handle, IntPtr header, uint size);
        [DllImport("winmm.dll")] static extern uint waveInStart(IntPtr handle);
        [DllImport("winmm.dll")] static extern uint waveInReset(IntPtr handle);
        [DllImport("winmm.dll")] static extern uint waveInClose(IntPtr handle);
        [DllImport("winmm.dll")] static extern uint waveOutOpen(out IntPtr handle, uint device, ref Format format, IntPtr callback, IntPtr instance, uint flags);
        [DllImport("winmm.dll")] static extern uint waveOutPrepareHeader(IntPtr handle, IntPtr header, uint size);
        [DllImport("winmm.dll")] static extern uint waveOutUnprepareHeader(IntPtr handle, IntPtr header, uint size);
        [DllImport("winmm.dll")] static extern uint waveOutWrite(IntPtr handle, IntPtr header, uint size);
        [DllImport("winmm.dll")] static extern uint waveOutReset(IntPtr handle);
        [DllImport("winmm.dll")] static extern uint waveOutClose(IntPtr handle);
        static readonly uint HeaderSize = (uint)Marshal.SizeOf(typeof(Header));
        static volatile bool cancelled;

        public static void ListenForCancellation() {
            cancelled = false;
            Task.Run(() => { Console.In.ReadLine(); cancelled = true; });
        }
        static Format Pcm(int sampleRate) {
            return new Format { tag = 1, channels = 1, samplesPerSecond = (uint)sampleRate,
                bytesPerSecond = (uint)sampleRate * 2, blockAlign = 2, bits = 16, extra = 0 };
        }
        static void Check(uint code, string operation) {
            if (code != 0) throw new InvalidOperationException(operation + " failed (WinMM " + code + "). Check the default audio device, Windows microphone privacy permission, and device usage.");
        }
        static IntPtr NewHeader(int length) {
            IntPtr data = Marshal.AllocHGlobal(length);
            IntPtr header = Marshal.AllocHGlobal((int)HeaderSize);
            Marshal.StructureToPtr(new Header { data = data, length = (uint)length }, header, false);
            return header;
        }
        static Header ReadHeader(IntPtr header) { return (Header)Marshal.PtrToStructure(header, typeof(Header)); }
        static void FreeHeader(IntPtr header) {
            if (header == IntPtr.Zero) return;
            Marshal.FreeHGlobal(ReadHeader(header).data);
            Marshal.FreeHGlobal(header);
        }

        public static void Play(byte[] pcm, int sampleRate) {
            IntPtr handle;
            Format format = Pcm(sampleRate);
            Check(waveOutOpen(out handle, uint.MaxValue, ref format, IntPtr.Zero, IntPtr.Zero, 0), "waveOutOpen");
            IntPtr header = IntPtr.Zero;
            bool prepared = false;
            try {
                header = NewHeader(pcm.Length);
                Marshal.Copy(pcm, 0, ReadHeader(header).data, pcm.Length);
                Check(waveOutPrepareHeader(handle, header, HeaderSize), "waveOutPrepareHeader");
                prepared = true;
                Check(waveOutWrite(handle, header, HeaderSize), "waveOutWrite");
                Console.WriteLine("{\"type\":\"ready\"}");
                while (!cancelled && (ReadHeader(header).flags & 1) == 0) Thread.Sleep(5);
            } finally {
                waveOutReset(handle);
                if (prepared) waveOutUnprepareHeader(handle, header, HeaderSize);
                waveOutClose(handle);
                FreeHeader(header);
            }
        }

        public static void Capture(int sampleRate, int durationMs) {
            IntPtr handle;
            Format format = Pcm(sampleRate);
            Check(waveInOpen(out handle, uint.MaxValue, ref format, IntPtr.Zero, IntPtr.Zero, 0), "waveInOpen");
            IntPtr[] headers = new IntPtr[8];
            bool[] prepared = new bool[8];
            try {
                int bytesPerFrame = sampleRate * 30 / 1000 * 2;
                for (int i = 0; i < headers.Length; i++) {
                    headers[i] = NewHeader(bytesPerFrame);
                    Check(waveInPrepareHeader(handle, headers[i], HeaderSize), "waveInPrepareHeader");
                    prepared[i] = true;
                    Check(waveInAddBuffer(handle, headers[i], HeaderSize), "waveInAddBuffer");
                }
                Check(waveInStart(handle), "waveInStart");
                Console.WriteLine("{\"type\":\"ready\"}");
                Stopwatch elapsed = Stopwatch.StartNew();
                int index = 0;
                while (!cancelled && (durationMs == 0 || elapsed.ElapsedMilliseconds < durationMs)) {
                    IntPtr pointer = headers[index];
                    Header header = ReadHeader(pointer);
                    if ((header.flags & 1) == 0) { Thread.Sleep(3); continue; }
                    if (header.recorded > 0) {
                        byte[] data = new byte[header.recorded];
                        Marshal.Copy(header.data, data, 0, data.Length);
                        Console.WriteLine("{\"type\":\"audio\",\"pcm\":\"" + Convert.ToBase64String(data) + "\"}");
                    }
                    Check(waveInAddBuffer(handle, pointer, HeaderSize), "waveInAddBuffer");
                    index = (index + 1) % headers.Length;
                }
            } finally {
                waveInReset(handle);
                for (int i = 0; i < headers.Length; i++) {
                    if (prepared[i]) waveInUnprepareHeader(handle, headers[i], HeaderSize);
                    FreeHeader(headers[i]);
                }
                waveInClose(handle);
            }
        }
    }
}
