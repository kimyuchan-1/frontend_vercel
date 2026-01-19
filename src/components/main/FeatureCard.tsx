import Image from "next/image";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: string;
  title: string;
  children: ReactNode;
}

export default function FeatureCard({ icon, title, children }: FeatureCardProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
                <Image src={icon} alt={`${title} icon`} width={32} height={32} className="mr-4" />
                <h3 className="text-xl font-bold">{title}</h3>
            </div>
            <div className="text-gray-600">
                {children}
            </div>
        </div>
    )
};