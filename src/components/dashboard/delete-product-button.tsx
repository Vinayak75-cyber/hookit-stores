"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Trash2 } from "lucide-react";

export function DeleteProductButton({
  productId,
  productName,
  storeSlug,
}: {
  productId: string;
  productName: string;
  storeSlug: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      alert("Failed to delete product: " + error.message);
      setIsDeleting(false);
      return;
    }

    // Refresh the page to show updated list
    window.location.reload();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 rounded-lg text-[#999999] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      title="Delete"
    >
      <Trash2 className={`w-4 h-4 ${isDeleting ? "animate-pulse" : ""}`} />
    </button>
  );
}