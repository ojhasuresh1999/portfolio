"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";

// =============================================================================
// Premium Chat Join Form - Guest registration with stunning visuals
// =============================================================================

const joinSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
});

type JoinFormData = z.infer<typeof joinSchema>;

interface ChatJoinFormProps {
  onJoin: (data: JoinFormData & { photo?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function ChatJoinForm({ onJoin, isLoading = false }: ChatJoinFormProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Photo must be less than 2MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please upload an image file");
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: JoinFormData) => {
    await onJoin({ ...data, photo: photo || undefined });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {/* Glowing Card Container */}
      <div className="relative group">
        {/* Animated glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />

        {/* Card */}
        <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-800/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/10 to-transparent rounded-tr-full" />

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="relative space-y-7"
          >
            {/* Photo Upload - Centered Hero */}
            <div className="flex justify-center pb-2">
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group/avatar relative"
              >
                {/* Rotating gradient border */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full opacity-75 blur group-hover/avatar:opacity-100 transition-opacity animate-spin-slow" />

                <div className="relative w-28 h-28 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                  {photo ? (
                    <img
                      src={photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <motion.span
                        animate={{ y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="material-symbols-outlined text-3xl text-primary"
                      >
                        add_a_photo
                      </motion.span>
                      <span className="block text-[10px] text-slate-500 mt-1 font-medium">
                        Add Photo
                      </span>
                    </div>
                  )}
                </div>

                {/* Success badge */}
                {photo && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
                  >
                    <span className="material-symbols-outlined text-sm text-black font-bold">
                      check
                    </span>
                  </motion.div>
                )}
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            {photoError && (
              <p className="text-red-400 text-xs text-center -mt-4">
                {photoError}
              </p>
            )}

            {/* Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">
                Your Name
              </label>
              <div
                className={`relative rounded-xl transition-all duration-300 ${focusedField === "name" ? "ring-2 ring-primary/50" : ""}`}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <span
                    className={`material-symbols-outlined transition-colors ${focusedField === "name" ? "text-primary" : "text-slate-500"}`}
                  >
                    person
                  </span>
                </div>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="John Doe"
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all ${
                    errors.name
                      ? "border-red-500/50"
                      : "border-white/10 focus:border-primary/50"
                  }`}
                />
              </div>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs ml-1 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">
                    error
                  </span>
                  {errors.name.message}
                </motion.p>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">
                Email Address
              </label>
              <div
                className={`relative rounded-xl transition-all duration-300 ${focusedField === "email" ? "ring-2 ring-primary/50" : ""}`}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <span
                    className={`material-symbols-outlined transition-colors ${focusedField === "email" ? "text-primary" : "text-slate-500"}`}
                  >
                    mail
                  </span>
                </div>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="john@example.com"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all ${
                    errors.email
                      ? "border-red-500/50"
                      : "border-white/10 focus:border-primary/50"
                  }`}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs ml-1 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">
                    error
                  </span>
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full py-4 px-6 rounded-xl font-semibold text-black overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              {/* Button gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-[#00ff88] to-secondary transition-all duration-300 group-hover/btn:scale-105" />

              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />

              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">
                      progress_activity
                    </span>
                    Connecting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">
                      rocket_launch
                    </span>
                    Start Conversation
                  </>
                )}
              </span>
            </motion.button>

            {/* Privacy Note */}
            <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-xs">lock</span>
              Your information is secure and encrypted
            </p>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
