import React, { useEffect, useState } from "react";
import { useAuth, type UserAddress } from "../context/AuthContext";
import { Check, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";

interface Draft {
  id?: string;
  title: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const EMPTY_DRAFT: Draft = {
  title: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Pakistan",
  isDefault: false,
};

const fieldClass =
  "flex-1 bg-transparent border border-gold/30 px-4 py-3 text-xs tracking-widest placeholder:text-muted focus:outline-none focus:border-gold rounded";

const AddressField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}> = ({ label, value, onChange, required, placeholder, autoComplete }) => (
  <label className="block space-y-1.5">
    <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold">
      {label} {required && <span className="text-rose-300">*</span>}
    </span>
    <input
      type="text"
      value={value}
      required={required}
      placeholder={placeholder}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      className={fieldClass}
    />
  </label>
);

export default function AddressBook() {
  const {
    addresses,
    addressesLoading,
    addressesError,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
  } = useAuth();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
  }, [draft]);

  const startAdd = () => {
    setNotice(null);
    setDraft({ ...EMPTY_DRAFT, fullName: "", phone: "" });
  };

  const startEdit = (address: UserAddress) => {
    setNotice(null);
    setDraft({
      id: address.id,
      title: address.title || "",
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "Pakistan",
      isDefault: address.isDefault,
    });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!draft.addressLine1.trim() || !draft.city.trim()) {
      setFormError("Street address and city are required.");
      return;
    }
    setBusy(true);
    const payload: Omit<UserAddress, "id"> = {
      title: draft.title.trim() || (draft.isDefault ? "Default address" : "Saved address"),
      fullName: draft.fullName.trim(),
      phone: draft.phone.trim(),
      addressLine1: draft.addressLine1.trim(),
      addressLine2: draft.addressLine2.trim() || undefined,
      city: draft.city.trim(),
      state: draft.state.trim() || undefined,
      postalCode: draft.postalCode.trim(),
      country: draft.country.trim() || "Pakistan",
      isDefault: draft.isDefault,
    };
    const ok = draft.id
      ? await updateAddress(draft.id, payload)
      : await addAddress(payload);
    setBusy(false);
    if (ok) {
      setDraft(null);
      setNotice(draft.id ? "Your address was updated." : "Your address was saved.");
    } else {
      setFormError("The address was not saved. Please try again.");
    }
  };

  const makeDefault = async (id: string) => {
    setBusy(true);
    const ok = await setDefaultAddress(id);
    setBusy(false);
    setNotice(ok ? "Default delivery address updated." : "That address could not be set as default.");
  };

  const remove = async (id: string) => {
    setBusy(true);
    const ok = await removeAddress(id);
    setBusy(false);
    setConfirmRemoveId(null);
    setNotice(ok ? "Your address was removed." : "The address could not be removed.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            DELIVERY DESTINATIONS
          </span>
          <h2 className="text-2xl font-serif font-bold text-ivory mt-0.5">
            Your Saved Addresses ({addresses.length})
          </h2>
        </div>
        {!draft && (
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-bold rounded-lg text-xs uppercase tracking-wider shadow-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add address</span>
          </button>
        )}
      </div>

      {(notice || addressesError) && (
        <p
          role="status"
          aria-live="polite"
          className={`px-4 py-3 rounded-lg border text-xs font-sans ${
            addressesError
              ? "bg-rose-950/40 border-rose-600/50 text-rose-200"
              : "bg-emerald-950/40 border-emerald-700/50 text-emerald-200"
          }`}
        >
          {addressesError || notice}
        </p>
      )}

      {draft && (
        <form
          onSubmit={save}
          className="bg-navy2/90 border border-gold/25 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-ivory">
              {draft.id ? "Edit address" : "Add a delivery address"}
            </h3>
            <button
              type="button"
              onClick={() => setDraft(null)}
              aria-label="Cancel address form"
              className="inline-flex items-center justify-center min-h-11 min-w-11 text-muted hover:text-ivory rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <AddressField
              label="Label"
              value={draft.title}
              onChange={(v) => setDraft({ ...draft, title: v })}
              placeholder="Home, Atelier apartment, Office…"
              autoComplete="off"
            />
            <AddressField
              label="Recipient name"
              value={draft.fullName}
              onChange={(v) => setDraft({ ...draft, fullName: v })}
              placeholder="Full name on the parcel"
              autoComplete="name"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <AddressField
              label="Street address"
              value={draft.addressLine1}
              onChange={(v) => setDraft({ ...draft, addressLine1: v })}
              required
              placeholder="House / apartment number and street"
              autoComplete="address-line1"
            />
            <AddressField
              label="Apartment, floor (optional)"
              value={draft.addressLine2}
              onChange={(v) => setDraft({ ...draft, addressLine2: v })}
              placeholder="Flat, building, landmark"
              autoComplete="address-line2"
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AddressField
              label="City"
              value={draft.city}
              onChange={(v) => setDraft({ ...draft, city: v })}
              required
              placeholder="City"
              autoComplete="address-level2"
            />
            <AddressField
              label="State / region"
              value={draft.state}
              onChange={(v) => setDraft({ ...draft, state: v })}
              placeholder="Punjab"
              autoComplete="address-level1"
            />
            <AddressField
              label="Postal code"
              value={draft.postalCode}
              onChange={(v) => setDraft({ ...draft, postalCode: v })}
              placeholder="54000"
              autoComplete="postal-code"
            />
            <AddressField
              label="Country"
              value={draft.country}
              onChange={(v) => setDraft({ ...draft, country: v })}
              required
              placeholder="Pakistan"
              autoComplete="country-name"
            />
          </div>

          <AddressField
            label="Contact number"
            value={draft.phone}
            onChange={(v) => setDraft({ ...draft, phone: v })}
            placeholder="+92 300 0000000"
            autoComplete="tel"
          />

          <label className="flex items-center gap-3 cursor-pointer min-h-11">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
              className="w-4 h-4 accent-gold"
            />
            <span className="text-xs text-ivory font-sans">
              Use this as my default delivery address
            </span>
          </label>

          {formError && (
            <p role="alert" className="text-xs text-rose-300 font-sans">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="btn-gold-fill inline-flex items-center space-x-2 disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{busy ? "Saving…" : draft.id ? "Save changes" : "Save address"}</span>
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="px-4 py-2.5 border border-gold/30 text-ivory hover:border-gold rounded-lg text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addressesLoading ? (
        <p role="status" className="text-xs text-muted font-sans">
          Loading your saved addresses…
        </p>
      ) : addresses.length === 0 && !draft ? (
        <div className="bg-navy2/80 border border-gold/20 rounded-2xl p-8 text-center space-y-3">
          <MapPin className="w-7 h-7 text-gold/70 mx-auto" aria-hidden="true" />
          <p className="font-serif text-lg text-ivory">No saved addresses yet</p>
          <p className="text-xs text-muted font-light max-w-sm mx-auto">
            Save a delivery destination once and use it on your next order. You can also enter an
            address at checkout without signing in.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <article
              key={address.id}
              className={`rounded-2xl border p-5 space-y-3 shadow-lg ${
                address.isDefault ? "border-gold/50 bg-navy2/90" : "border-gold/20 bg-navy2/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-base font-bold text-ivory leading-snug break-words">
                  {address.title}
                </h3>
                {address.isDefault && (
                  <span className="shrink-0 inline-flex items-center space-x-1 text-[10px] font-mono uppercase tracking-[2px] text-navy bg-gold px-2 py-0.5 rounded">
                    <Star className="w-3 h-3" aria-hidden="true" />
                    <span>Default</span>
                  </span>
                )}
              </div>

              <address className="not-italic text-xs text-muted font-light leading-relaxed space-y-0.5">
                {(address.fullName || address.phone) && (
                  <span className="block text-ivory">
                    {[address.fullName, address.phone].filter(Boolean).join(" · ")}
                  </span>
                )}
                <span className="block">{address.addressLine1}</span>
                {address.addressLine2 && <span className="block">{address.addressLine2}</span>}
                <span className="block">
                  {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
                </span>
                <span className="block">{address.country}</span>
              </address>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => makeDefault(address.id)}
                    disabled={busy}
                    className="inline-flex items-center space-x-1.5 text-[11px] uppercase tracking-wider text-gold hover:text-goldLight disabled:opacity-60 min-h-11"
                  >
                    <Star className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Set as default</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(address)}
                  className="inline-flex items-center space-x-1.5 text-[11px] uppercase tracking-wider text-ivory hover:text-gold min-h-11"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Edit</span>
                </button>
                {confirmRemoveId === address.id ? (
                  <span className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => remove(address.id)}
                      disabled={busy}
                      className="text-[11px] uppercase tracking-wider text-rose-200 bg-rose-950/50 border border-rose-600/50 rounded px-2.5 py-1 min-h-11"
                    >
                      Confirm remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(null)}
                      className="text-[11px] uppercase tracking-wider text-muted hover:text-ivory min-h-11"
                    >
                      Keep
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveId(address.id)}
                    className="inline-flex items-center space-x-1.5 text-[11px] uppercase tracking-wider text-rose-300 hover:text-rose-200 min-h-11"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
