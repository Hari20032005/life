import type { Metadata } from "next";
import { SearchBox } from "@/components/learning/search-box";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return <div className="mx-auto max-w-3xl space-y-6"><h1 className="text-3xl font-extrabold">Search</h1><SearchBox /></div>;
}
