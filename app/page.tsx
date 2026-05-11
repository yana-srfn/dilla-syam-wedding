"use client";

import { useEffect, useRef, useState } from "react";

type MemoryItem = {
  id: string;
  type: "image" | "video";
  url: string;
};

export default function WeddingGallery() {
  const [page, setPage] = useState<"home" | "camera" | "gallery">("home");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<MemoryItem | null>(null);
  const [gallery, setGallery] = useState<MemoryItem[]>([]);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
  async function fetchGallery() {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwh-eyLYkXDifHmNV0Tn3BDpiUHFX69hO2eQwJ0txCq9T5aWBZ2z2NZNqxY7bJv-3sHjQ/exec"
      );

      const data = await response.json();

      const formatted = data.map((item: any) => ({
        id: item.id,
        type: item.mimeType.includes("video") ? "video" : "image",
        url: item.downloadUrl,
      }));

      setGallery(formatted);
    } catch (error) {
      console.log(error);
    }
  }

  fetchGallery();

  const interval = setInterval(fetchGallery, 5000);

  return () => clearInterval(interval);
}, []);

  async function openCamera(videoMode = false) {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: videoMode,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      alert("Please allow camera permissions.");
    }
  }

  function takePhoto() {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);

      setPreview({
        id: crypto.randomUUID(),
        type: "image",
        url,
      });
    }, "image/jpeg");
  }

  function startRecording() {
    if (!stream) return;

    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: "video/webm",
      });

      const url = URL.createObjectURL(blob);

      setPreview({
        id: crypto.randomUUID(),
        type: "video",
        url,
      });

      setRecording(false);
    };

    recorder.start();
    setRecording(true);

    setTimeout(() => {
      stopRecording();
    }, 10000);
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setRecording(false);
    }
  }

  function saveToPhone() {
    if (!preview) return;

    const link = document.createElement("a");

    link.href = preview.url;
    link.download =
      preview.type === "image"
        ? "dilla-syam-memory.jpg"
        : "dilla-syam-memory.webm";

    link.click();
  }

  async function uploadMemory() {
    if (!preview || uploading) return;

    setUploading(true);

    try {
      const response = await fetch(preview.url);
      const blob = await response.blob();

      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(",")[1];

        const uploadResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbwh-eyLYkXDifHmNV0Tn3BDpiUHFX69hO2eQwJ0txCq9T5aWBZ2z2NZNqxY7bJv-3sHjQ/exec",
          {
            method: "POST",
            body: JSON.stringify({
              fileName:
                preview.type === "image"
                  ? `memory-${Date.now()}.jpg`
                  : `memory-${Date.now()}.webm`,
              mimeType: preview.type === "image" ? "image/jpeg" : "video/webm",
              fileData: base64data,
            }),
          }
        );

        const result = await uploadResponse.json();

        if (result.success) {
          setGallery((prev) => [preview, ...prev]);
          setPreview(null);
          alert("Uploaded successfully 🌸");
        } else {
          alert("Upload failed");
        }

        setUploading(false);
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
      setUploading(false);
    }
  }

  if (page === "home") {
    return (
      <main className="min-h-screen bg-[#fff9f2] px-4 py-8 text-stone-700">
        <div className="mx-auto flex min-h-[90vh] max-w-5xl flex-col items-center justify-center text-center">
          <p className="mb-4 text-xs tracking-[0.25em] text-[#9cab97] uppercase sm:text-sm">
            Wedding Memory Garden
          </p>

          <h1 className="font-serif text-5xl leading-tight text-stone-800 sm:text-7xl md:text-8xl">
            Dilla <span className="text-[#b7c4b2]">&</span> Syam
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-stone-600 sm:text-lg">
            Capture sweet moments, upload memories, and watch them appear live
            during the wedding celebration 🌸
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={() => setPage("camera")}
              className="w-full rounded-full bg-[#b7c4b2] px-8 py-4 text-base font-medium text-white shadow-lg transition hover:bg-[#9cab97] sm:w-auto"
            >
              Capture a Memory
            </button>

            <button
              onClick={() => setPage("gallery")}
              className="w-full rounded-full border border-[#d8cce6] bg-white/80 px-8 py-4 text-base font-medium shadow-sm transition hover:bg-white sm:w-auto"
            >
              View Live Gallery
            </button>
          </div>

          <div className="mt-10 w-full rounded-[2rem] border border-white/70 bg-white/50 p-3 shadow-lg backdrop-blur sm:p-6">
            <img
              src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1400&auto=format&fit=crop"
              alt="Wedding"
              className="h-[260px] w-full rounded-[1.5rem] object-cover sm:h-[400px]"
            />
          </div>

          <p className="mt-6 text-xs text-stone-500 sm:text-sm">
            12 October 2026 · #DillaSyamForever
          </p>
        </div>
      </main>
    );
  }

  if (page === "camera") {
    return (
      <main className="min-h-screen bg-[#fff9f2] px-4 py-6 text-stone-700">
        <button
          onClick={() => setPage("home")}
          className="mb-5 text-sm text-stone-500"
        >
          ← Back
        </button>

        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white/75 p-4 shadow-xl backdrop-blur sm:p-6">
          <h2 className="text-center font-serif text-4xl text-stone-800 sm:text-5xl">
            Capture a Memory
          </h2>

          <p className="mt-2 text-center text-sm text-stone-500">
            Take a photo or record a short 10-second video.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="overflow-hidden rounded-[1.5rem] bg-black">
              {preview ? (
                preview.type === "image" ? (
                  <img
                    src={preview.url}
                    alt="Preview"
                    className="h-[420px] w-full object-cover sm:h-[500px]"
                  />
                ) : (
                  <video
                    src={preview.url}
                    controls
                    className="h-[420px] w-full object-cover sm:h-[500px]"
                  />
                )
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-[420px] w-full object-cover sm:h-[500px]"
                />
              )}
            </div>

            <div className="flex flex-col gap-3">
              {!stream && (
                <>
                  <button
                    onClick={() => openCamera(false)}
                    className="rounded-2xl bg-[#b7c4b2] px-6 py-4 font-medium text-white"
                  >
                    Open Photo Camera
                  </button>

                  <button
                    onClick={() => openCamera(true)}
                    className="rounded-2xl bg-[#d8cce6] px-6 py-4 font-medium text-stone-700"
                  >
                    Open Video Camera
                  </button>
                </>
              )}

              {stream && !preview && (
                <>
                  <button
                    onClick={takePhoto}
                    className="rounded-2xl bg-[#b7c4b2] px-6 py-4 font-medium text-white"
                  >
                    Take Photo
                  </button>

                  {!recording ? (
                    <button
                      onClick={startRecording}
                      className="rounded-2xl bg-[#d8cce6] px-6 py-4 font-medium text-stone-700"
                    >
                      Record 10s Video
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="rounded-2xl bg-red-300 px-6 py-4 font-medium text-white"
                    >
                      Stop Recording
                    </button>
                  )}
                </>
              )}

              {preview && (
                <>
                  <button
                    onClick={saveToPhone}
                    className="rounded-2xl border border-stone-200 bg-white px-6 py-4 font-medium"
                  >
                    Save to Phone
                  </button>

                  <button
                    onClick={uploadMemory}
                    disabled={uploading}
                    className="rounded-2xl bg-[#b7c4b2] px-6 py-4 font-medium text-white disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload to Live Gallery"}
                  </button>

                  <button
                    onClick={() => setPreview(null)}
                    disabled={uploading}
                    className="rounded-2xl bg-stone-100 px-6 py-4 font-medium disabled:opacity-50"
                  >
                    Retake
                  </button>
                </>
              )}

              <p className="mt-3 rounded-2xl bg-[#f8d7da]/40 p-4 text-sm leading-6 text-stone-600">
                Tip: Hold your phone vertically for best results.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff9f2] px-4 py-6 text-stone-700">
      <button
        onClick={() => setPage("home")}
        className="mb-5 text-sm text-stone-500"
      >
        ← Back
      </button>

      <div className="text-center">
        <h2 className="font-serif text-5xl text-stone-800 sm:text-6xl">
          Live Wedding Gallery
        </h2>

        <p className="mt-3 text-sm text-stone-500 sm:text-base">
          Memories uploaded by guests 🌸
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.length === 0 && (
          <div className="col-span-full rounded-[2rem] bg-white/70 p-8 text-center shadow">
            <p className="text-stone-500">No memories uploaded yet 🌸</p>
          </div>
        )}

        {gallery.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-[2rem] bg-white p-3 shadow-lg"
          >
            {item.type === "image" ? (
              <img
                src={item.url}
                alt="Wedding memory"
                className="h-[320px] w-full rounded-[1.5rem] object-cover sm:h-[350px]"
              />
            ) : (
              <video
                src={item.url}
                controls
                className="h-[320px] w-full rounded-[1.5rem] object-cover sm:h-[350px]"
              />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}