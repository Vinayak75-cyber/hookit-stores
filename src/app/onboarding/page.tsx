"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  Calendar,
  ShoppingBag,
  UtensilsCrossed,
  ArrowRight,
  Check,
  Clock,
} from "lucide-react";

const storeTypes = [
    {
      id: "online-store",
      title: "Online Store",
      description: "Sell products online with your own storefront",
      icon: ShoppingBag,
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
      active: true,
      comingSoon: false,
    },
    {
      id: "events",
      title: "Eventss",
      description: "Sell tickets and manage event registrations",
      icon: Calendar,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
      active: false,
      comingSoon: true,
    },
    {
      id: "restaurant",
      title: "Restaurant",
      description: "Take orders and reservations for your restaurant",
      icon: UtensilsCrossed,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
      active: false,
      comingSoon: true,
    },
  ];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (typeId: string) => {
    if (typeId === "restaurant") return;

    setSelectedType(typeId);

    if (typeId === "events") {
      router.push("/create-event-store");
    } else {
      router.push("/create-store");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-[#e5e5e5]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#666666] hover:text-[#1a1a1a] transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
            What are you building?
          </h1>
          <p className="text-[#888888] text-lg max-w-xl mx-auto">
            Choose the type of business you want to create. You can always add more later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-12">
          {storeTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            const isComingSoon = type.comingSoon;

            return (
              <button
                key={type.id}
                onClick={() => handleSelect(type.id)}
                disabled={isComingSoon}
                className={`group relative text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                  isComingSoon
                    ? "border-[#e5e5e5] opacity-60 cursor-not-allowed"
                    : isSelected
                    ? "border-[#1a1a1a] shadow-lg"
                    : "border-[#e5e5e5] hover:border-[#1a1a1a] hover:shadow-md cursor-pointer"
                }`}
              >
                {/* Image Area */}
<div className="relative h-48 overflow-hidden bg-[#1a1a1a]">
  <img
    src={type.image}
    alt={type.title}
    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
  />
  
  {isComingSoon && (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <span className="bg-white text-[#1a1a1a] px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Coming Soon
      </span>
    </div>
  )}

  {isSelected && !isComingSoon && (
    <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg z-10">
      <Check className="w-4 h-4 text-[#1a1a1a]" />
    </div>
  )}
</div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? "bg-[#1a1a1a]" : "bg-[#f5f5f5] group-hover:bg-[#1a1a1a] transition-colors"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isSelected ? "text-white" : "text-[#1a1a1a] group-hover:text-white transition-colors"
                      }`} />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1a1a1a]">{type.title}</h3>
                  </div>
                  <p className="text-[#888888] text-sm leading-relaxed mb-4">
                    {type.description}
                  </p>
                  {!isComingSoon && (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#1a1a1a] group-hover:gap-2 transition-all">
                      Get started
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[#999999] text-sm">
          Free to start. No credit card required.
        </p>
      </div>
    </div>
  );
}