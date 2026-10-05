import type { Metadata } from "next";

export const metadata: Metadata = { title: "Salas" };

// Placeholder so the post-sign-in redirect has a target; TASK 04 replaces it with the room list.
export default function RoomsPage() {
  return <h1 className="text-2xl font-semibold tracking-tight">Salas</h1>;
}
