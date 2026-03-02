import { Link } from "react-router-dom";
import { ArrowRight, Zap, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-gradient relative flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="animate-slide-up space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">New Season Drop</p>
          <h1 className="font-display text-5xl font-bold leading-tight sm:text-7xl lg:text-8xl">
            WEAR THE
            <br />
            <span className="text-gradient">VOLTAGE</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Bold fashion for those who dare to stand out. Premium streetwear crafted for the fearless.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/products">
              <Button size="lg" className="gap-2 font-display text-lg font-semibold">
                Shop Now <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-20">
        <div className="container grid gap-8 md:grid-cols-3">
          {[
            { icon: Zap, title: "Premium Quality", desc: "Handcrafted with the finest materials for lasting style." },
            { icon: Truck, title: "Fast Shipping", desc: "Free shipping on orders over $100. Delivered in 3-5 days." },
            { icon: Shield, title: "Secure Checkout", desc: "Your payments are protected with industry-leading security." },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Join the <span className="text-gradient">VLTGE</span> Movement
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Sign up for early access to new drops, exclusive discounts, and more.
          </p>
          <Link to="/auth" className="mt-6 inline-block">
            <Button size="lg" className="font-display font-semibold">Create Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-display text-lg font-bold text-gradient">VLTGE</span>
          <p className="text-xs text-muted-foreground">© 2026 VLTGE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
