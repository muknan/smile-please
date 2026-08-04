"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { updateDentistProfile, uploadProfilePhoto, type ProfileState } from "@/app/dentist/actions";

const initial: ProfileState = { ok: false };

export function ProfileForm({
  displayName,
  locality,
  specialties,
  languages,
  bio,
}: {
  displayName: string;
  locality: string;
  specialties: string[];
  languages: string[];
  bio: string | null;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateDentistProfile,
    initial,
  );
  const [photoState, setPhotoState] = useState<ProfileState>({ ok: false });
  const [photoPending, setPhotoPending] = useState(false);

  const onPhoto = async (formData: FormData) => {
    setPhotoPending(true);
    try {
      setPhotoState(await uploadProfilePhoto(formData));
    } finally {
      setPhotoPending(false);
    }
  };

  return (
    <>
      <form action={formAction} className="mt-10 max-w-[65ch] space-y-8">
        <Field label="Display name" htmlFor="displayName" required hint="Shown on the public site.">
          <Input id="displayName" name="displayName" defaultValue={displayName} required />
        </Field>
        <Field label="Locality" htmlFor="locality" required>
          <Input id="locality" name="locality" defaultValue={locality} required />
        </Field>
        <Field
          label="Specialties"
          htmlFor="specialties"
          hint="Comma separated, e.g. General dentistry, Child dentistry"
        >
          <Input id="specialties" name="specialties" defaultValue={specialties.join(", ")} />
        </Field>
        <Field
          label="Languages"
          htmlFor="languages"
          hint="Comma separated, e.g. Hindi, English"
        >
          <Input id="languages" name="languages" defaultValue={languages.join(", ")} />
        </Field>
        <Field label="Bio" htmlFor="bio" hint="A few plain sentences patients can trust.">
          <Textarea id="bio" name="bio" rows={5} defaultValue={bio ?? ""} />
        </Field>

        {state.note && (
          <p role="status" className="text-body-s text-neem-600">
            {state.note}
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-body-s text-clay-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neem-900 px-6 py-3 font-utility text-body-s font-medium text-chalk-0 transition hover:bg-neem-600 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form action={onPhoto} className="mt-14 max-w-[65ch] border-t border-neem-100 pt-10">
        <h2 className="text-display-m">Profile photo</h2>
        <p className="mt-2 text-body-s text-ink-950/60">
          A square JPEG or PNG under 1.5 MB — it appears inside an arch on the
          directory.
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input type="file" name="photo" accept="image/png,image/jpeg,image/webp" />
          <button
            type="submit"
            disabled={photoPending}
            className="rounded bg-neem-900 px-6 py-3 font-utility text-body-s font-medium text-chalk-0 transition hover:bg-neem-600 disabled:opacity-50"
          >
            {photoPending ? "Uploading…" : "Upload photo"}
          </button>
        </div>
        {photoState.ok && photoState.note && (
          <p role="status" className="mt-4 text-body-s text-neem-600">
            {photoState.note}
          </p>
        )}
        {photoState.error && (
          <p role="alert" className="mt-4 text-body-s text-clay-600">
            {photoState.error}
          </p>
        )}
      </form>
    </>
  );
}
