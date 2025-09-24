// app/avatar/page.js
export default function AvatarPage() {
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Choose Your Avatar</h1>
      <div className="flex gap-4">
        <button data-tour="avatar-male" className="px-4 py-2 rounded border">Male</button>
        <button data-tour="avatar-female" className="px-4 py-2 rounded border">Female</button>
      </div>
      <a
        data-tour="continue-to-intake"
        href="/intake"
        className="inline-block px-4 py-2 rounded bg-black text-white"
      >
        Continue
      </a>
    </main>
  );
}
