"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import { deleteAccountAction } from "@/app/actions";
import { resetStore, saveProfile, useStore } from "@/lib/store";
import { GENDERS, type Gender } from "@/lib/types";

const toNumber = (v: string) => (v === "" ? null : Number(v));

export default function ProfilePage() {
  const { user, profile } = useStore();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const { signOut } = useClerk();
  const router = useRouter();

  const deleteAccount = async () => {
    setDeleting(true);
    setError("");
    try {
      await deleteAccountAction();
    } catch {
      setDeleting(false);
      setConfirmingDelete(false);
      setError("Could not delete your account. Please try again.");
      return;
    }
    resetStore();
    // the session died with the user, so signOut may reject; leave either way
    await signOut({ redirectUrl: "/login" }).catch(() => router.replace("/login"));
  };

  const set = (patch: Partial<typeof form>) => {
    setSaved(false);
    setForm((f) => ({ ...f, ...patch }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted">{user?.email}</p>
      </div>

      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          saveProfile({ ...form, name: form.name.trim() }).then(
            () => setSaved(true),
            () => setError("Could not save your profile. Please try again."),
          );
        }}
      >
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="field"
            autoComplete="name"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="age">
              Age
            </label>
            <input
              id="age"
              className="field"
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              value={form.age ?? ""}
              onChange={(e) => set({ age: toNumber(e.target.value) })}
            />
          </div>
          <div>
            <label className="label" htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              className="field"
              value={form.gender}
              onChange={(e) => set({ gender: e.target.value as Gender | "" })}
            >
              <option value="">Select…</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="height">
              Height (cm)
            </label>
            <input
              id="height"
              className="field"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              value={form.heightCm ?? ""}
              onChange={(e) => set({ heightCm: toNumber(e.target.value) })}
            />
          </div>
          <div>
            <label className="label" htmlFor="weight">
              Weight (kg)
            </label>
            <input
              id="weight"
              className="field"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              value={form.weightKg ?? ""}
              onChange={(e) => set({ weightKg: toNumber(e.target.value) })}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full">
          {saved ? "Saved" : "Save changes"}
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-lg border border-foreground px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <button
          type="button"
          className="btn w-full"
          onClick={() => signOut({ redirectUrl: "/login" })}
        >
          <LogOut size={16} />
          Sign out
        </button>
        <button type="button" className="btn w-full" onClick={() => setConfirmingDelete(true)}>
          <Trash2 size={16} />
          Delete account
        </button>
      </div>

      {confirmingDelete && (
        <BottomSheet title="Delete account?" onClose={() => setConfirmingDelete(false)}>
          <p className="text-sm text-muted">
            This permanently removes your profile and every workout you have logged. It cannot be
            undone.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" className="btn" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={deleteAccount}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete everything"}
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
