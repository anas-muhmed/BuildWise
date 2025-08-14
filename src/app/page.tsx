import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "../../components/DashboardLayout";
import HeroSection from "../../components/HeroSection";
import { PlusCircle, GraduationCap } from "lucide-react";
import React from "react";

// OpenAI-ish swirl (simple, neutral SVG)
const Swirl = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
    <path
      d="M12 2.5c2.9 0 5.5 1.7 6.6 4.4 2.2.3 3.9 2.2 3.9 4.5 0 2-1.3 3.8-3.1 4.4.1.4.1.7.1 1.1 0 3.3-2.7 6-6 6-2.2 0-4.2-1.2-5.2-3-2.6-.1-4.8-2.3-4.8-5 0-1.7.9-3.3 2.3-4.2-.1-.4-.1-.8-.1-1.3 0-3.1 2.5-5.6 5.6-5.6Z"
      fill="currentColor"
      fillOpacity=".15"
    />
    <path
      d="M12 4c-2.4 0-4.4 2-4.4 4.4 0 .4.1.9.2 1.3l.2.6-.6.3C6 11.1 5.1 12.5 5.1 14c0 2.2 1.8 4 4 4 .2 0 .4 0 .6 0l.7-.1.3.6c.8 1.5 2.3 2.5 4 2.5 2.4 0 4.4-2 4.4-4.4 0-.3 0-.6-.1-.9l-.2-.7.7-.2c1.4-.4 2.4-1.7 2.4-3.1 0-1.8-1.5-3.3-3.3-3.3-.2 0-.4 0-.6 0l-.7.2-.2-.6C16.7 5.3 14.5 4 12 4Zm0-1.5c2.9 0 5.5 1.7 6.6 4.4 2.2.3 3.9 2.2 3.9 4.5 0 2-1.3 3.8-3.1 4.4.1.4.1.7.1 1.1 0 3.3-2.7 6-6 6-2.2 0-4.2-1.2-5.2-3-2.6-.1-4.8-2.3-4.8-5 0-1.7.9-3.3 2.3-4.2-.1-.4-.1-.8-.1-1.3 0-3.1 2.5-5.6 5.6-5.6Z"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

const features = [
  {
    title: "Start New Design",
    href: "/design",
    icon: <PlusCircle className="h-6 w-6 text-indigo-600" />,
    description: "Begin a new system design with drag & drop tools.",
  },
  {
    title: "Student Mode",
    href: "/student",
    icon: <GraduationCap className="h-6 w-6 text-indigo-600" />,
    description: "Get simplified AI explanations for learning.",
  },
  {
    title: "Generative AI Design",
    href: "/ai",
    icon: <Swirl />,
    description: "Generate a system architecture from a text prompt.",
  },
];

export default function Home() {
  return (
    <DashboardLayout>
      <HeroSection />

      {/* centered, tidy 3-card grid */}
      <section className="mx-auto mt-10 w-full max-w-6xl px-2">
        <div
          className="
            grid gap-6
            sm:grid-cols-2
            lg:grid-cols-3
            items-stretch
          "
        >
          {features.map((f, i) => (
            <Link key={i} href={f.href} className="group">
              <Card className="h-full transition-all duration-200 group-hover:shadow-lg group-active:scale-[0.99]">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-xl p-2 bg-indigo-50 text-indigo-700">
                    {f.icon}
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
