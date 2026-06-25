import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <Link href="/" className={"flex items-center gap-2 " + className}>
      <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
        <ShoppingBag className="w-4 h-4 text-white" />
      </div>
      <span className="text-xl font-bold tracking-tight text-black">hookit</span>
    </Link>
  );
}
