"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "../../components/DashboardLayout";
import HeroSection from "../../components/HeroSection";
import { PlusCircle, GraduationCap, Sparkles } from "lucide-react";
import React from "react";

const features = [
	{
		title: "Start New Design",
		href: "/design",
		icon: <PlusCircle className="h-6 w-6 text-indigo-600" />,
		description:
			"Design architectures with precise drag & drop and smart connections.",
	},
	{
		title: "Student Mode",
		href: "/student",
		icon: <GraduationCap className="h-6 w-6 text-indigo-600" />,
		description:
			"Clear, step‑by‑step explanations of core system design concepts.",
	},
	{
		title: "Generative AI Design",
		href: "/ai",
		icon: <Sparkles className="h-6 w-6 text-indigo-600" />,
		description:
			"Describe your idea and let AI propose a production‑ready blueprint.",
	},
];

export default function Home() {
	return (
		<div className="min-h-screen bg-gray-50">
			<DashboardLayout>
				<HeroSection />

				<section className="mx-auto w-full max-w-6xl px-6 py-10">
					<h2 className="mb-6 text-2xl font-semibold text-zinc-900">
						Features
					</h2>

					<div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{features.map((f, i) => (
							<Link key={i} href={f.href} className="group">
								<Card className="h-full border border-zinc-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
									<CardHeader className="flex items-center gap-4">
										<div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700">
											{f.icon}
										</div>
										<CardTitle className="text-lg font-semibold text-zinc-900">
											{f.title}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm leading-6 text-zinc-600">
											{f.description}
										</p>

										<span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-700 group-hover:text-indigo-800">
											Open
											<span className="h-[2px] w-10 rounded-full bg-indigo-300 transition-all group-hover:w-16" />
										</span>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</section>

				<footer className="mt-12 border-t bg-white">
					<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-zinc-500">
						<p>© {new Date().getFullYear()} BuildWise. All rights reserved.</p>
						<div className="hidden gap-6 sm:flex">
							<Link
								href="/docs"
								className="hover:text-zinc-700"
							>
								Docs
							</Link>
							<Link
								href="/changelog"
								className="hover:text-zinc-700"
							>
								Changelog
							</Link>
							<Link
								href="/contact"
								className="hover:text-zinc-700"
							>
								Contact
							</Link>
						</div>
					</div>
				</footer>
			</DashboardLayout>
		</div>
	);
}
