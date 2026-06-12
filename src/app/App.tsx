import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ValidationSection } from "./components/ValidationSection";
import { WildSection } from "./components/WildSection";
import { MethodSection } from "./components/MethodSection";
import { ScanSection } from "./components/ScanSection";
import { CitationSection } from "./components/CitationSection";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Header />
      <Hero />
      <ValidationSection />
      <WildSection />
      <MethodSection />
      <ScanSection />
      <CitationSection />
      <Footer />
    </div>
  );
}
