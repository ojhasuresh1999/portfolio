import { settingsService } from "@/server/services/settings.service";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export default async function ResumePage() {
  let resumeUrl = "";

  try {
    const result = await settingsService.getPublic();
    if (result.success && result.data) {
      resumeUrl =
        ((result.data as Record<string, unknown>).resumeUrl as string) || "";
    }
  } catch (error) {
    console.error("Failed to fetch resume settings:", error);
  }

  const viewerUrl = resumeUrl
    ? `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`
    : "";

  return (
    <>
      <Navbar />

      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-slate-900 animate-gradient-xy" />

      <main className="flex-1 px-6 py-32 flex flex-col items-center justify-center min-h-[85vh] relative z-10 w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl mb-8 gap-4">
          <h1 className="text-3xl font-bold text-white">My Resume</h1>
          {resumeUrl && (
            <a
              href={resumeUrl}
              download="Resume"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:shadow-[0_0_30px_rgba(0,242,255,0.5)]"
            >
              <span className="material-symbols-outlined text-xl">
                download
              </span>
              Download Resume
            </a>
          )}
        </div>

        {resumeUrl ? (
          <div className="w-full max-w-5xl h-[75vh] rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-white/5">
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0 bg-white"
              title="Resume Viewer"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="text-center p-12 border border-white/10 bg-white/5 rounded-2xl backdrop-blur-md">
            <span className="material-symbols-outlined text-6xl text-slate-500 mb-4 block">
              description
            </span>
            <p className="text-xl text-slate-300">Resume not uploaded yet.</p>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
