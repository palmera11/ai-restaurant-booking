"use client";

interface GuestDetails {
  name: string;
  phone: string;
  email: string;
  special_requests: string;
}

interface Props {
  details: GuestDetails;
  onChange: (details: GuestDetails) => void;
}

export function StepGuestDetails({ details, onChange }: Props) {
  function update(field: keyof GuestDetails) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...details, [field]: e.target.value });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--color-n-500)" }}>
          Full name <span style={{ color: "var(--color-danger)" }}>*</span>
        </label>
        <input
          type="text"
          placeholder="John Appleseed"
          value={details.name}
          onChange={update("name")}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--color-n-500)" }}>
          Phone number <span style={{ color: "var(--color-danger)" }}>*</span>
        </label>
        <input
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={details.phone}
          onChange={update("phone")}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--color-n-500)" }}>
          Email <span className="opacity-50">(optional)</span>
        </label>
        <input
          type="email"
          placeholder="john@example.com"
          value={details.email}
          onChange={update("email")}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--color-n-500)" }}>
          Special requests <span className="opacity-50">(optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Allergies, high chair, window seat..."
          value={details.special_requests}
          onChange={update("special_requests")}
          className="input-field"
          style={{ resize: "none" }}
        />
      </div>
    </div>
  );
}
