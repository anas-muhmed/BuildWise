import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "../../components/DashboardLayout";
import HeroSection from "../../components/HeroSection";
import {
  PlusCircle,
  GraduationCap,
  FolderOpen,
  Brain,
  Trophy,
} from "lucide-react";

const features = [
  {
    title: "Start New Design",
    icon: <PlusCircle className="h-6 w-6 text-indigo-600" />,
    description: "Begin a new system design with drag & drop tools.",
  },
  {
    title: "Student Mode",
    icon: <GraduationCap className="h-6 w-6 text-indigo-600" />,
    description: "Get simplified AI explanations for learning.",
  },
  {
    title: "Continue Work",
    icon: <FolderOpen className="h-6 w-6 text-indigo-600" />,
    description: "Open your saved designs and continue building.",
  },
  {
    title: "View Samples",
    icon: <Brain className="h-6 w-6 text-indigo-600" />,
    description: "Explore example architectures from other students.",
  },
  {
    title: "Leaderboard",
    icon: <Trophy className="h-6 w-6 text-indigo-600" />,
    description: "See top-performing designs and contributors.",
  },
];

export default function Home() {
  return (
    <DashboardLayout>
      <HeroSection/>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <Card key={idx} className="hover:shadow-md transition duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              {feature.icon}
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
