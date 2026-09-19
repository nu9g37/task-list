"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { UserAvatar } from "./user-avatar";

type ProfileDialogProps = {
  name: string;
  email: string;
  image: string | null;
  onClose: () => void;
  onSaveName: (name: string) => Promise<string | undefined>;
  onSaveImage: (image: string) => Promise<string | undefined>;
  onSignOut: () => Promise<string | undefined>;
};

async function prepareProfileImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 5 MB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to process this image.");
    const scale = Math.max(256 / bitmap.width, 256 / bitmap.height);
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    context.drawImage(bitmap, (256 - width) / 2, (256 - height) / 2, width, height);
    return canvas.toDataURL("image/webp", 0.82);
  } finally {
    bitmap.close();
  }
}

export function ProfileDialog({ name, email, image, onClose, onSaveName, onSaveImage, onSignOut }: ProfileDialogProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [savingName, setSavingName] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string>();
  const busy = savingName || savingImage || signingOut;

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose]);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = nameDraft.trim();
    if (!nextName) {
      setError("Name cannot be empty.");
      return;
    }
    if (nextName === name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    setError(undefined);
    try {
      const message = await onSaveName(nextName);
      if (message) setError(message);
      else setEditingName(false);
    } catch {
      setError("Unable to update your name. Please try again.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setError(undefined);
    try {
      const message = await onSignOut();
      if (message) setError(message);
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSavingImage(true);
    setError(undefined);
    try {
      const nextImage = await prepareProfileImage(file);
      const message = await onSaveImage(nextImage);
      if (message) setError(message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update your picture.");
    } finally {
      setSavingImage(false);
    }
  }

  return (
    <div
      aria-labelledby="profile-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      role="dialog"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <span className="size-9" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900" id="profile-dialog-title">Profile</h2>
          <button
            aria-label="Close profile"
            className="grid size-9 place-items-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center gap-2">
          <UserAvatar email={email} image={image} large name={name} />
          <input
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choose profile picture"
            className="sr-only"
            onChange={handleImageChange}
            ref={imageInputRef}
            tabIndex={-1}
            type="file"
          />
          <button
            aria-label="Edit profile picture"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
            disabled={busy}
            onClick={() => imageInputRef.current?.click()}
            type="button"
          >
            {savingImage ? "Saving..." : "Edit"}
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Name</span>
              {!editingName ? (
                <button
                  aria-label="Edit name"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  onClick={() => {
                    setNameDraft(name);
                    setError(undefined);
                    setEditingName(true);
                  }}
                  type="button"
                >
                  Edit
                </button>
              ) : null}
            </div>
            {editingName ? (
              <form className="flex gap-2" onSubmit={saveName}>
                <input
                  aria-label="Name"
                  autoFocus
                  className="min-w-0 flex-1 rounded-xl border border-indigo-300 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50"
                  disabled={savingName}
                  maxLength={80}
                  onChange={(event) => setNameDraft(event.target.value)}
                  required
                  value={nameDraft}
                />
                <button className="rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-60" disabled={savingName} type="submit">
                  Save
                </button>
                <button
                  className="rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600"
                  disabled={savingName}
                  onClick={() => {
                    setEditingName(false);
                    setError(undefined);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">{name}</div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Email</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">{email}</div>
          </div>
        </div>

        {error ? <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p> : null}

        <div className="mt-7 border-t border-slate-100 pt-5 text-center">
          <button
            className="rounded-xl border border-rose-200 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            disabled={busy}
            onClick={handleSignOut}
            type="button"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
