"use client";

import { useActionState } from "react";
import { saveExperience } from "../../../actions";

type Opt = { value: string; label: string };
type Values = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  whyWeLoveIt: string;
  included: string;
  goodToKnow: string;
  citySlug: string;
  categories: string[];
  recipients: string[];
  occasions: string[];
  images: string;
  isBestseller: boolean;
  isNew: boolean;
  isActive: boolean;
  seasonNote: string;
  minAge: string;
  options: string;
  locations: string;
};

export function ExperienceForm({
  experience,
  categories,
  cities,
  recipientTags,
  occasionTags,
}: {
  experience: Values | null;
  categories: Opt[];
  cities: Opt[];
  recipientTags: string[];
  occasionTags: Opt[];
}) {
  const [state, action, pending] = useActionState(saveExperience, null);
  const v = experience;
  return (
    <form action={action} className="grid gap-6 xl:grid-cols-3">
      {v && <input type="hidden" name="id" value={v.id} />}
      <div className="space-y-5 rounded-[1.5rem] border border-line bg-paper p-6 xl:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Title">
            <input name="title" required defaultValue={v?.title} className="input" />
          </L>
          <L label="URL slug" hint="e.g. sunset-sail-lake-ontario">
            <input name="slug" required defaultValue={v?.slug} className="input" />
          </L>
        </div>
        <L label="Summary (card text, 1–2 sentences)">
          <textarea name="summary" required defaultValue={v?.summary} className="textarea min-h-20" />
        </L>
        <L label="Description" hint="Separate paragraphs with a blank line">
          <textarea name="description" required defaultValue={v?.description} className="textarea min-h-40" />
        </L>
        <L label="Why we love it">
          <textarea name="whyWeLoveIt" defaultValue={v?.whyWeLoveIt} className="textarea min-h-20" />
        </L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L label="What's included" hint="One per line">
            <textarea name="included" defaultValue={v?.included} className="textarea" />
          </L>
          <L label="Good to know" hint="One per line">
            <textarea name="goodToKnow" defaultValue={v?.goodToKnow} className="textarea" />
          </L>
        </div>
        <L label="Options" hint="One per line: Label | max people | duration | price in dollars — e.g. For two | 2 | 2 hours | 180">
          <textarea name="options" required defaultValue={v?.options} className="textarea font-mono text-sm" />
        </L>
        <L label="Locations" hint="One per line: Name | Address or area | Bookable times">
          <textarea name="locations" defaultValue={v?.locations} className="textarea font-mono text-sm" />
        </L>
        <L label="Photo URLs" hint="One per line — first is the main photo. Use your own hosted images (e.g. from your storage bucket).">
          <textarea name="images" defaultValue={v?.images} className="textarea font-mono text-sm" />
        </L>
      </div>

      <div className="space-y-5 rounded-[1.5rem] border border-line bg-paper p-6">
        <div className="space-y-2 text-sm">
          <Check name="isActive" label="Visible on the site" defaultChecked={v?.isActive ?? true} />
          <Check name="isBestseller" label="Bestseller badge" defaultChecked={v?.isBestseller} />
          <Check name="isNew" label="New badge" defaultChecked={v?.isNew} />
        </div>
        <L label="Location / region">
          <select name="citySlug" defaultValue={v?.citySlug ?? "toronto"} className="select">
            {cities.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </L>
        <div className="grid grid-cols-2 gap-3">
          <L label="Season note">
            <input name="seasonNote" defaultValue={v?.seasonNote} placeholder="Available May to October" className="input" />
          </L>
          <L label="Minimum age">
            <input name="minAge" type="number" min={0} defaultValue={v?.minAge} className="input" />
          </L>
        </div>
        <Group title="Categories">
          {categories.map((c) => (
            <Check key={c.value} name="categories" value={c.value} label={c.label} defaultChecked={v?.categories.includes(c.value)} />
          ))}
        </Group>
        <Group title="Good for">
          {recipientTags.map((t) => (
            <Check key={t} name="recipients" value={t} label={t} defaultChecked={v?.recipients.includes(t)} />
          ))}
        </Group>
        <Group title="Occasions">
          {occasionTags.map((o) => (
            <Check key={o.value} name="occasions" value={o.value} label={o.label} defaultChecked={v?.occasions.includes(o.value)} />
          ))}
        </Group>
        {state?.error && <p className="rounded-xl bg-clay-mist px-4 py-3 text-sm text-clay-deep">{state.error}</p>}
        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Saving…" : "Save experience"}
        </button>
      </div>
    </form>
  );
}

function L({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Check({ name, label, value, defaultChecked }: { name: string; label: string; value?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} value={value ?? "on"} defaultChecked={defaultChecked} className="h-4 w-4 accent-[var(--color-moss)]" />
      {label}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="label">{title}</legend>
      <div className="grid grid-cols-2 gap-1.5">{children}</div>
    </fieldset>
  );
}
